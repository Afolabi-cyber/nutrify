"""
Nutrify - Flask + Vertex AI Gemini backend
─────────────────────────────────────────
Auth model: NO API key. Auth is done via the service-account JSON file
that lives next to this app.py (configured in .env via GOOGLE_CREDENTIALS_FILE).

Pattern used (matches the user's reference snippet exactly):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "<path-to-json>"
    os.environ["GOOGLE_CLOUD_PROJECT"]           = "<project>"
    os.environ["GOOGLE_CLOUD_LOCATION"]          = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"]      = "True"
    client = genai.Client(http_options=HttpOptions(api_version="v1"))
"""

from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from google import genai
from google.genai.types import HttpOptions, Part
from google.api_core import exceptions
from dotenv import load_dotenv
import os
import time
import random
import re
import mimetypes
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import json
import sqlite3

load_dotenv()

# ─── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
app.secret_key = os.getenv('SECRET_KEY', 'dev_key_very_secret_123')
CORS(app, origins="*", supports_credentials=True)

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
DB_FILE = os.path.join(BASE_DIR, 'nutrify.db')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── Vertex AI / Gemini Client (NO API KEY — service-account JSON only) ────────
# Drop your service-account JSON next to app.py and set its filename in .env:
#   GOOGLE_CREDENTIALS_FILE=nutrify-food-nutrition-xxxx.json
_cred_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'nutrify-food-nutrition-3b3efa7ce249.json')
_cred_path = os.path.join(BASE_DIR, _cred_file)

if not os.path.exists(_cred_path):
    print(f"⚠️  Credentials file not found at: {_cred_path}")
    print(f"    Set GOOGLE_CREDENTIALS_FILE in .env to your JSON filename.")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _cred_path
os.environ["GOOGLE_CLOUD_PROJECT"]           = os.getenv('GOOGLE_CLOUD_PROJECT', 'nutrify-food-nutrition')
os.environ["GOOGLE_CLOUD_LOCATION"]          = os.getenv('GOOGLE_CLOUD_LOCATION', 'global')
os.environ["GOOGLE_GENAI_USE_VERTEXAI"]      = "True"

client = genai.Client(http_options=HttpOptions(api_version="v1"))

# ─── Product Catalogue with deficiency-keyword mapping ─────────────────────────
# Each product lists which nutrient deficiencies / dietary issues it addresses.
# The health-analysis prompt uses this to pick the RIGHT product for the scan.
# A fallback keyword matcher (pick_product_for_deficiencies) gives the server
# a second line of defence if Gemini returns an off-catalogue product name.
PRODUCT_CATALOGUE = {
    "Vitamin C & Zinc": {
        "link":       "https://nutrifyng.com/products/vitamin-c-zinc",
        "image":      "/products/vitamin-c-zinc.png",
        "addresses":  ["vitamin c deficiency", "zinc deficiency", "low immunity",
                       "antioxidant deficit", "slow wound healing", "iron absorption issues"],
        "keywords":   ["vitamin c", "zinc", "immunity", "immune", "antioxidant",
                       "wound", "iron absorption", "cold", "flu"],
    },
    "Immunity Booster": {
        "link":       "https://nutrifyng.com/products/immunity-booster",
        "image":      "/products/immunity-booster.png",
        "addresses":  ["low immunity", "vitamin c deficiency", "zinc deficiency",
                       "elderberry", "high sugar diet", "high carb diet"],
        # Note: keywords focused on immunity/sugar — fried/processed/oily diets
        # should route to Liver Detox instead, so those keywords live there.
        "keywords":   ["immunity", "immune", "elderberry", "cold", "flu",
                       "sugar", "high sugar"],
    },
    "Collagen (Skin, Hair & Nails)": {
        "link":       "https://nutrifyng.com/products/collagen-beauty-formula-60-tablets",
        "image":      "/products/collagen.png",
        "addresses":  ["collagen deficiency", "skin health", "low protein",
                       "vitamin c deficiency", "hair and nail health", "anti-aging"],
        "keywords":   ["collagen", "skin", "hair", "nail", "beauty", "aging",
                       "anti-aging", "protein deficiency"],
    },
    "Menx Performance Support": {
        "link":       "https://nutrifyng.com/products/menx-performance-support-tablets-60-tablets",
        "image":      "/products/menx-performance-support.png",
        "addresses":  ["low testosterone", "zinc deficiency", "male reproductive health",
                       "energy deficit", "low libido", "high processed food", "selenium deficiency"],
        "keywords":   ["testosterone", "male", "men", "libido", "reproductive",
                       "energy", "zinc", "selenium"],
        "gender":     "male",
    },
    "Women's Multivitamin": {
        "link":       "https://nutrifyng.com/products/women-s-multivitamin-30-tablets",
        "image":      "/products/womens-multivitamin.png",
        "addresses":  ["iron deficiency", "folate deficiency", "calcium deficiency",
                       "vitamin d deficiency", "female hormonal balance", "multiple micronutrient gaps"],
        "keywords":   ["iron", "folate", "calcium", "vitamin d", "hormonal",
                       "menstrual", "anaemia", "anemia", "multivitamin", "micronutrient"],
        "gender":     "female",
    },
    "Men's Multivitamin": {
        "link":       "https://nutrifyng.com/products/multivitamin-for-men-60-tablet",
        "image":      "/products/mens-multivitamin.png",
        "addresses":  ["b vitamin deficiency", "magnesium deficiency", "selenium deficiency",
                       "multiple micronutrient gaps", "energy deficit", "muscle health"],
        "keywords":   ["b vitamin", "b-complex", "magnesium", "selenium",
                       "energy", "muscle", "multivitamin", "micronutrient"],
        "gender":     "male",
    },
    "Men's 50+ Multivitamin": {
        "link":       "https://nutrifyng.com/products/men-s-50-multivitamin-30-tablets",
        "image":      "/products/mens-50-multivitamin.png",
        "addresses":  ["age-related nutrient decline", "vitamin d deficiency", "b12 deficiency",
                       "heart health", "prostate health", "bone health", "multiple micronutrient gaps"],
        "keywords":   ["age", "older", "50+", "elderly", "b12", "heart",
                       "prostate", "bone", "vitamin d"],
        "gender":     "male",
    },
    "Liver Detox": {
        "link":       "https://nutrifyng.com/products/liv-detox-formula",
        "image":      "/products/liver-detox.png",
        "addresses":  ["high fat diet", "processed food", "fried food", "high sodium",
                       "liver stress", "alcohol-heavy diet", "preservative-heavy food",
                       "palm oil excess", "aflatoxin risk"],
        "keywords":   ["liver", "fat", "fried", "oil", "palm oil", "sodium",
                       "salt", "alcohol", "preservative", "detox", "aflatoxin"],
    },
    "Complete Wellness Trio": {
        "link":       "https://nutrifyng.com/products/complete-wellness-trio",
        "image":      "/products/complete-wellness-trio.png",
        "addresses":  ["multiple micronutrient gaps", "overall nutritional deficit",
                       "balanced diet support", "energy deficit", "general wellness"],
        "keywords":   ["multiple", "general wellness", "balanced", "overall",
                       "micronutrient gaps"],
    },
    "Ultimate Beauty & Wellness Pack": {
        "link":       "https://nutrifyng.com/products/ultimate-beauty-wellness-pack",
        "image":      "/products/ultimate-beauty-wellness-pack.png",
        "addresses":  ["collagen deficiency", "skin health", "vitamin c deficiency",
                       "multiple micronutrient gaps", "female wellness", "hair and nail health"],
        "keywords":   ["beauty", "skin", "hair", "nail", "collagen", "female"],
        "gender":     "female",
    },
    "Couples Wellness Premium": {
        "link":       "https://nutrifyng.com/products/complete-wellness-trio",
        "image":      "/products/couples-wellness-premium.png",
        "addresses":  ["multiple micronutrient gaps", "reproductive health",
                       "male and female wellness", "energy deficit", "general wellness"],
        "keywords":   ["couple", "reproductive", "fertility", "wellness"],
    },
}

PRODUCT_LINKS  = {k: v["link"]  for k, v in PRODUCT_CATALOGUE.items()}
PRODUCT_IMAGES = {k: v["image"] for k, v in PRODUCT_CATALOGUE.items()}


# ─── MNDC 2021 Reference Knowledge (Federal Ministry of Health, Nigeria) ───────
# Key thresholds, target groups, and deficiency benchmarks extracted from the
# National Guidelines for Prevention and Control of Micronutrient Deficiencies
# in Nigeria (July 2021). Used to ground all nutritional analysis.
MNDC_REFERENCE = """
SOURCE: Nigeria Federal Ministry of Health — National Guidelines for Prevention and
Control of Micronutrient Deficiencies in Nigeria (2021 revision, MNDC Guidelines).

════════════════════════════════════════════════════════════════════
SECTION A — PUBLIC HEALTH SIGNIFICANCE THRESHOLDS (Nigeria 2021)
════════════════════════════════════════════════════════════════════
• Vitamin A Deficiency (VAD):
  - National prevalence in children <5 yrs: 29.5% (WHO global DB) / 24.8% serum <20µg/dl (NFCNS 2003)
  - VAD = serum retinol <0.70 µmol/L (<20 µg/dl)
  - Night blindness in pregnant women: 7.7% — above WHO public health threshold of 5%
  - Excess VAD: dry/northern savanna > moist savanna > humid/southern forest

• Iron Deficiency Anaemia (IDA):
  - 68% of under-5 children anaemic (NDHS 2018): 27% mild, 38% moderate, 3% severe
  - 58% pregnant women anaemic; peak anaemia 81% at 12–17 months of age
  - North West/North East worst affected; Lagos lowest
  - Children in rural areas (73%) more anaemic than urban (62%)
  - Haemoglobin cut-offs for anaemia diagnosis:
      Children 6–59 months:  Normal ≥11 | Mild 10–10.9 | Moderate 7–9.9 | Severe <7 g/dl
      Non-pregnant women:    Normal ≥12 | Mild 11–11.9 | Moderate 8–10.9 | Severe <8 g/dl
      Pregnant women:        Normal ≥11 | Mild 10–10.9 | Moderate 7–9.9  | Severe <7 g/dl
      Men:                   Normal ≥13 | Mild 11–12.9 | Moderate 8–10.9 | Severe <8 g/dl

• Zinc Deficiency:
  - 20% of under-5 children zinc-deficient (NFCNS 2003)
  - Highest in moist savanna (36.5%), intermediate dry savanna (26%), lowest humid forest (6.3%)
  - 43.8% of pregnant women zinc-deficient; 28.1% of mothers
  - RDA: 8 mg/day women, 11 mg/day men

• Iodine Deficiency:
  - Nigeria achieved Universal Salt Iodisation (USI) — household access to iodised salt: 97% (NDHS 2018)
  - Standard: >50 mg/kg at factory; >30 mg/kg retail; >15 mg/kg household level
  - Risk remains in Zamfara (63%), Niger (67%) states

• Folate Deficiency:
  - Low folate = increased neural tube defect risk, megaloblastic anaemia
  - Main dietary sources: leafy greens, fruits, yeast, liver
  - Risk factor: high refined cereal diet + low leafy vegetable intake (common Nigerian dietary pattern)

════════════════════════════════════════════════════════════════════
SECTION B — HIGH-RISK FOODS / DIETARY PATTERNS IN NIGERIA
════════════════════════════════════════════════════════════════════
• HIGH RISK PATTERNS (flag these in analysis):
  - High palm oil / excessive fried food → liver stress, high saturated fat
  - High seasoning cube usage → excessive sodium (>2300 mg/day risk)
  - High refined white rice / fufu / eba without vegetables → poor fibre, low vitamins
  - Low animal protein diet → risk of iron, zinc, B12 deficiency
  - Low dairy / calcium intake → bone health concern
  - High simple sugar (sodas, processed sweets) → blood sugar load
  - Low dark green leafy vegetable intake → vitamin A, folate, iron risk
  - Processing methods that destroy nutrients (over-boiling greens, re-using fry oil)

• PROTECTIVE FOODS (highlight these if present):
  - Dark green leaves: Ugu (Vit A, iron, folate), Ewedu (calcium, iron), Bitter leaf (zinc, antioxidants)
  - Orange foods: carrots, tatashe, orange-flesh sweet potato → Vitamin A / beta-carotene
  - Legumes: beans, moin moin, akara, cowpea → plant protein, iron, folate, zinc
  - Fish (titus/mackerel, catfish, sardines) → omega-3, vitamin D, protein
  - Liver → highest bioavailable iron, Vitamin A, B12
  - Fermented locust bean (iru/dawadawa), crayfish → protein, minerals
  - Moringa (zogale) → iron, calcium, Vitamin A, C — highly underutilised in Nigeria
  - Ofada/brown rice → B-vitamins, fibre vs white rice

════════════════════════════════════════════════════════════════════
SECTION C — SUPPLEMENTATION GUIDELINES (Nigeria MNDC 2021)
════════════════════════════════════════════════════════════════════
• Children 6–59 months: Vitamin A capsules twice yearly
    - 6–11 months: 100,000 IU; 12–59 months: 200,000 IU
• Pregnant women: Daily MMS (Multiple Micronutrient Supplement, 13–15 components) — replaces IFAS
• Children with diarrhoea: Zinc 20 mg/day for 10–14 days + Lo-ORS
• Adolescent girls / NPNL women: Weekly IFAS (60 mg iron + 2800 µg folic acid) where anaemia >20%
• Mandatory fortification vehicles: wheat/maize flour, sugar, vegetable oil (Vit A); salt (iodine)
• Voluntary: bouillon cubes, rice (encouraged, under discussion)

════════════════════════════════════════════════════════════════════
SECTION D — FOUR CORE STRATEGIES (prioritised order, MNDC 2021)
════════════════════════════════════════════════════════════════════
1. Dietary diversification — most sustainable long-term approach
2. Food fortification — mandatory and voluntary
3. Nutritional supplementation — for high-risk groups, short-term
4. Other health interventions — deworming, malaria prevention, WASH

════════════════════════════════════════════════════════════════════
SECTION E — DISCLAIMER REQUIREMENT (legal / public health)
════════════════════════════════════════════════════════════════════
All nutritional analysis output MUST be accompanied by a disclaimer that:
- The analysis is for informational and educational purposes only
- It is NOT a substitute for professional medical or dietetic advice
- Users with health conditions should consult a qualified healthcare provider
- Supplementation should only be taken on professional advice
"""

def _build_catalogue_prompt():
    lines = []
    for name, info in PRODUCT_CATALOGUE.items():
        gender_tag = ""
        if info.get("gender") == "male":
            gender_tag = " [FOR MEN ONLY]"
        elif info.get("gender") == "female":
            gender_tag = " [FOR WOMEN ONLY]"
        issues = ", ".join(info["addresses"])
        lines.append(f'  - "{name}"{gender_tag}: best for → {issues}')
    return "\n".join(lines)

CATALOGUE_PROMPT = _build_catalogue_prompt()

# ─── Server-side product matching (safety net + name normalisation) ────────────
def _normalize(text):
    return re.sub(r'[^a-z0-9]+', ' ', (text or '').lower()).strip()

def find_closest_catalogue_name(name):
    """If Gemini returns a slightly-off product name, snap it to the closest
    real catalogue entry. Avoids broken images/links from typos."""
    if not name:
        return None
    if name in PRODUCT_CATALOGUE:
        return name
    n = _normalize(name)
    # exact normalised match
    for canonical in PRODUCT_CATALOGUE:
        if _normalize(canonical) == n:
            return canonical
    # token overlap match
    best, best_score = None, 0
    for canonical in PRODUCT_CATALOGUE:
        cn = _normalize(canonical)
        tokens_a = set(n.split())
        tokens_b = set(cn.split())
        if not tokens_a or not tokens_b:
            continue
        overlap = len(tokens_a & tokens_b)
        if overlap > best_score:
            best, best_score = canonical, overlap
    return best if best_score >= 1 else None

def pick_product_for_deficiencies(deficiency_text, user_gender=None, exclude=None):
    """
    Score every catalogue product against a free-text deficiency description
    using its keyword list. Returns the highest-scoring product name.
    Used as a safety-net when Gemini gives us no usable products.
    """
    exclude = set(exclude or [])
    text = _normalize(deficiency_text)
    if not text:
        return None

    scores = []
    for name, info in PRODUCT_CATALOGUE.items():
        if name in exclude:
            continue
        prod_gender = info.get("gender")
        # Gender-locked products are only eligible when the user matches.
        # If we don't know the user's gender, skip gender-locked products
        # entirely — never default a male to a female-only product, or vice versa.
        if prod_gender:
            if not user_gender or prod_gender != user_gender:
                continue
        score = 0
        for kw in info["keywords"]:
            if kw in text:
                # weight longer keywords higher (they're more specific)
                score += 1 + len(kw.split())
        if score:
            scores.append((score, name))

    if not scores:
        return None
    scores.sort(reverse=True)
    return scores[0][1]

# ─── Database ──────────────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            age INTEGER,
            height REAL,
            weight REAL,
            gender TEXT
        )
    ''')
    try:
        c.execute('SELECT image_url, user_id FROM scans LIMIT 1')
    except sqlite3.OperationalError:
        c.execute('DROP TABLE IF EXISTS scans')
        c.execute('''
            CREATE TABLE scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ingredients TEXT,
                analysis_json TEXT,
                image_url TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
    conn.commit()
    conn.close()

init_db()

def save_scan(ingredients, analysis, image_url):
    user_id = session.get('user_id')
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(
            'INSERT INTO scans (user_id, ingredients, analysis_json, image_url) VALUES (?, ?, ?, ?)',
            (user_id, json.dumps(ingredients), json.dumps(analysis), image_url)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving scan: {e}")

# ─── Gemini helpers ────────────────────────────────────────────────────────────
def generate_with_retry(model_name, contents):
    """Call Vertex AI Gemini with exponential-backoff fallback across models."""
    fallback_models = [model_name, "gemini-2.0-flash", "gemini-1.5-flash"]
    base_delay = 5
    last_err = None
    for model in fallback_models:
        for attempt in range(3):
            try:
                return client.models.generate_content(model=model, contents=contents)
            except (exceptions.ResourceExhausted, exceptions.ServiceUnavailable) as e:
                last_err = e
                if attempt == 2:
                    break
                sleep_time = (base_delay * (2 ** attempt)) + (random.randint(0, 1000) / 1000)
                print(f"Retrying {model} in {sleep_time:.2f}s…")
                time.sleep(sleep_time)
            except Exception as e:
                last_err = e
                # other errors: jump to next fallback model
                print(f"Model {model} failed with {type(e).__name__}: {e}")
                break
    raise Exception(f"All models currently unavailable. Last error: {last_err}")

def image_to_part(filepath):
    """
    Load a local image file and return a genai Part with inline bytes.
    Vertex AI mode does NOT support client.files.upload() — must inline.
    """
    mime, _ = mimetypes.guess_type(filepath)
    if not mime:
        mime = "image/jpeg"
    with open(filepath, "rb") as f:
        data = f.read()
    return Part.from_bytes(data=data, mime_type=mime)

def clean_json(text):
    """Strip markdown code fences and return clean JSON string."""
    if text is None:
        return ""
    text = str(text).strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[1] if '\n' in text else text[3:]
        if '```' in text:
            text = text.rsplit('```', 1)[0]
    return text.strip()

def get_response_text(response):
    """Extract text from Gemini API response, handling various response formats."""
    try:
        if hasattr(response, 'text') and response.text:
            return response.text
    except Exception:
        pass
    try:
        if hasattr(response, 'candidates') and response.candidates:
            return response.candidates[0].content.parts[0].text
    except Exception:
        pass
    try:
        return str(response)
    except Exception:
        return None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── Auth Routes ───────────────────────────────────────────────────────────────
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    hashed_pw = generate_password_hash(password)
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
                  (email, hashed_pw, full_name))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        session['user_id'] = user_id
        return jsonify({'success': True, 'user': {'email': email, 'full_name': full_name}})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    conn.close()
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        return jsonify({'success': True, 'user': {
            'email': user['email'], 'full_name': user['full_name'],
            'age': user['age'], 'height': user['height'],
            'weight': user['weight'], 'gender': user['gender']
        }})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' not in session:
        return jsonify({'authenticated': False})
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
    user = c.fetchone()
    conn.close()
    if user:
        return jsonify({'authenticated': True, 'user': {
            'email': user['email'], 'full_name': user['full_name'],
            'age': user['age'], 'height': user['height'],
            'weight': user['weight'], 'gender': user['gender']
        }})
    return jsonify({'authenticated': False})

@app.route('/api/profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            UPDATE users SET full_name=?, age=?, height=?, weight=?, gender=? WHERE id=?
        ''', (data.get('full_name'), data.get('age'), data.get('height'),
              data.get('weight'), data.get('gender'), session['user_id']))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Static File Routes ────────────────────────────────────────────────────────
@app.route('/static/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/static/<path:path>')
def send_static_files(path):
    return send_from_directory(os.path.join(BASE_DIR, 'static'), path)

@app.route('/products/<path:path>')
def serve_product_image(path):
    products_dir = os.path.join(BASE_DIR, 'frontend', 'public', 'products')
    return send_from_directory(products_dir, path)

# ─── Analysis Routes ───────────────────────────────────────────────────────────
@app.route('/api/analyze-food', methods=['POST'])
def analyze_food():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if not (file and allowed_file(file.filename)):
            return jsonify({'error': 'Invalid file type'}), 400

        filename = secure_filename(file.filename)
        filename = f"{int(time.time())}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Vertex AI mode: send the image as inline bytes (Files API isn't
        # available on Vertex). image_to_part loads the saved upload.
        image_part = image_to_part(filepath)

        ingredients_prompt = """You are a Nigerian food and nutrition expert.

First, assess what kind of image this is:

REJECTION RULES — respond with the exact rejection code if ANY of these apply:
- If the image is NOT food at all (e.g. a person, object, scenery, document): respond only with NOT A FOOD
- If the image is AI-generated, digitally illustrated, animated, cartoon, CGI, or clearly not a real photograph of actual food: respond only with NOT REAL FOOD
- If the image is a drawing, painting, sketch, or artistic rendering of food (not a real photo): respond only with NOT REAL FOOD

Only proceed if the image is a REAL PHOTOGRAPH of actual food.

Identify ALL ingredients visible in this food image.

CRITICAL — USE LOCAL NIGERIAN NAMES:
- Always lead with the LOCAL NIGERIAN name, then put the common/English name in brackets.
  Examples:
    "Ugu (fluted pumpkin leaves)"
    "Tatashe (red bell pepper)"
    "Ata rodo (scotch bonnet pepper)"
    "Ede (cocoyam)"
    "Akamu / Ogi (corn pap)"
    "Ogiri / Iru (fermented locust beans)"
    "Efo tete (African spinach)"
    "Ewedu (jute leaves)"
    "Okra (ila)"
    "Garri (cassava flakes)"
    "Eba (cooked garri)"
    "Semovita / Semolina"
    "Amala (yam flour swallow)"
    "Fufu (cassava swallow)"
    "Banga (palm fruit extract)"
    "Egusi (melon seeds)"
    "Ofada rice"
    "Suya spice (yaji)"
    "Pomo (cow skin)"
    "Stockfish (okporoko)"
    "Crayfish (ede)"
    "Locust bean (iru / dawadawa)"
    "Bitter leaf (onugbu)"
    "Scent leaf (nchanwu / efinrin)"
    "Pounded yam (iyán)"
    "Akara (bean fritters)"
    "Moi moi (steamed bean pudding)"
    "Suya (spiced grilled meat)"
    "Bole / Boli (roasted plantain)"
    "Pepper soup (assorted)"
    "Ofe onugbu (bitter leaf soup)"
    "Ogbono soup"

- For packaged/processed foods, describe them generically (e.g. "instant noodles", "powdered milk", "seasoning cube", "cornflakes") rather than using brand names.
- Be specific — don't just say "vegetables", say "Efo tete (African spinach)" or "Ugu (fluted pumpkin leaves)".
- Be specific about meats — "Goat meat (asun-style)", "Catfish (point-and-kill)", "Titus fish (mackerel)".

Return ONLY a JSON object with exactly three keys:
1. "food_name": a short, specific name for the overall dish or meal (e.g. "Jollof Rice", "Egusi Soup with Pounded Yam", "Instant Noodles", "Fried Rice & Chicken"). Use Nigerian names where natural. If the meal has multiple distinct items, name the main one first.
2. "ingredients": a JSON array of ingredient strings as described above.
3. "macronutrients": an object estimating the nutritional content of a typical single serving of this meal, using Nigerian/FAO food composition data. Include:
   - "calories": integer kcal
   - "carbohydrates_g": integer grams
   - "protein_g": integer grams
   - "fibre_g": integer grams
   - "fats_g": integer grams

Format:
{"food_name": "Dish Name Here", "ingredients": ["ingredient1", "ingredient2", "ingredient3"], "macronutrients": {"calories": 450, "carbohydrates_g": 60, "protein_g": 15, "fibre_g": 4, "fats_g": 12}}"""

        try:
            response = generate_with_retry(
                model_name="gemini-2.5-flash",
                contents=[image_part, ingredients_prompt],
            )
        except Exception as e:
            print(f"Error calling generate_with_retry: {e}")
            raise

        try:
            response_text = get_response_text(response)
            if not response_text:
                raise ValueError("Could not extract text from Gemini response")
            ingredients_text = clean_json(response_text)
        except Exception as e:
            print(f"Error extracting response text: {e}, response type: {type(response)}")
            raise

        if "NOT REAL FOOD" in ingredients_text.upper():
            return jsonify({
                'error': 'not_real_food',
                'message': 'AI-generated, animated, or illustrated food images are not supported. Please upload a real photo of actual food.'
            }), 400

        if "NOT A FOOD" in ingredients_text.upper():
            return jsonify({
                'error': 'not_food',
                'message': 'This does not appear to be a food item. Please upload a real photo of food.'
            }), 400

        try:
            parsed = json.loads(ingredients_text)
            if isinstance(parsed, dict):
                ingredients = parsed.get('ingredients', [])
                food_name = parsed.get('food_name', '')
                macronutrients = parsed.get('macronutrients', None)
            else:
                ingredients = parsed
                food_name = ''
                macronutrients = None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from ingredients response: {e}, text: {ingredients_text}")
            raise

        image_url = f"/static/uploads/{filename}"
        return jsonify({'success': True, 'ingredients': ingredients, 'food_name': food_name, 'image_url': image_url, 'macronutrients': macronutrients})

    except Exception as e:
        print(f"Error in analyze_food: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-health', methods=['POST'])
def analyze_health():
    try:
        data = request.get_json()
        ingredients = data.get('ingredients', [])
        image_url = data.get('image_url', '')

        if not ingredients:
            return jsonify({'error': 'No ingredients provided'}), 400

        # Build user context
        user_context = ""
        user_gender = None
        if 'user_id' in session:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT age, gender, height, weight FROM users WHERE id = ?', (session['user_id'],))
            user = c.fetchone()
            conn.close()
            if user and user['age'] and user['gender']:
                user_context = f"The user is a {user['age']}-year-old {user['gender']}."
                user_gender = (user['gender'] or '').lower()

        gender_rule = ""
        if user_gender == 'male':
            gender_rule = "The user is MALE — never recommend female-only products."
        elif user_gender == 'female':
            gender_rule = "The user is FEMALE — never recommend male-only products."
        else:
            gender_rule = "Gender unknown — prefer gender-neutral products."

        health_prompt = f"""You are a certified nutrition expert with deep knowledge of global diets AND specialist knowledge of Nigerian/West African dietary patterns and micronutrient deficiencies.

You have been provided with the Nigeria Federal Ministry of Health MNDC 2021 Guidelines as your authoritative reference for:
- Deficiency thresholds and prevalence data
- At-risk populations and dietary risk patterns
- Recommended interventions and food-based strategies

{MNDC_REFERENCE}

════════════════════════════════════════════════════════════════════
FOOD TO ANALYSE
════════════════════════════════════════════════════════════════════
Ingredients: {', '.join(ingredients)}
{user_context}

════════════════════════════════════════════════════════════════════
STEP 1 — DETECT CUISINE TYPE
════════════════════════════════════════════════════════════════════
First, determine whether the food is:
  (a) Nigerian / West African
  (b) Other African cuisine
  (c) Asian cuisine (Chinese, Indian, Thai, Japanese, Korean, etc.)
  (d) Western / European cuisine
  (e) Middle Eastern / Mediterranean cuisine
  (f) Mixed or unclear

This determines which dietary risk patterns and reference values to apply.
For Nigerian/West African foods, apply the MNDC 2021 thresholds above directly.
For non-Nigerian foods, apply standard WHO/FAO micronutrient reference values and
note any context-specific risks for the cuisine type (e.g. sodium in Asian cuisine,
saturated fat in Western fast food, aflatoxin risk in Nigerian groundnut dishes).

════════════════════════════════════════════════════════════════════
STEP 2 — IDENTIFY NUTRITIONAL GAPS (most critical step)
════════════════════════════════════════════════════════════════════
Based on the detected cuisine and the MNDC 2021 reference:

A) List nutrients that are WELL SUPPLIED by these ingredients (highlights).
B) List nutrients that are DEFICIENT or INSUFFICIENT (concerns).
   Be specific — name the nutrient AND why it is lacking given the meal composition.
   Cross-reference against the MNDC high-risk patterns in Section B above.

Consider ALL of these:
  • Vitamins: A (retinol / beta-carotene), B1, B2, B3, B6, B9 (folate), B12, C, D, E, K
  • Minerals: Iron (heme vs non-heme), zinc, calcium, magnesium, selenium, iodine, potassium
  • Macros: carbohydrate quality, protein completeness, fat type (saturated vs unsaturated)
  • Fibre, antioxidants, omega-3 fatty acids
  • Excess risks: sodium, palm oil load, MSG/seasoning cubes, fried oil reuse, added sugars

For NIGERIAN meals especially flag:
  - Meals of mostly swallow (eba/fufu/amala) + soup without sufficient protein or greens
  - High palm oil soups without dark leafy vegetables → low Vit A, iron, folate
  - Instant noodles meals → high sodium, low protein, very low micronutrients
  - Rice dishes without protein or vegetables → low iron, zinc, B12, fibre

For NON-NIGERIAN meals flag cuisine-specific risks:
  - Asian noodle/rice dishes: often sodium-heavy, low calcium, low iron if no meat/tofu
  - Western fast food: saturated fat, sodium, low fibre, low vitamins
  - Mediterranean: generally better balanced — note what specific benefits are present

════════════════════════════════════════════════════════════════════
STEP 3 — RECOMMENDATIONS (must be practical and locally accessible)
════════════════════════════════════════════════════════════════════
Write 3 practical recommendations.

IF the food is Nigerian/West African:
  Every recommendation MUST name a specific Nigerian ingredient available at
  Nigerian markets (Mile 12, Balogun, Oyingbo, Wuse, Mile 1) or supermarkets (ShopRite, Spar, Ebeano).
  Examples by deficiency:
    Iron → "Add ugu (fluted pumpkin leaves) or ewedu to your soup"
    Vitamin A → "Include tatashe (red bell pepper) or orange-flesh sweet potato"
    Protein → "Add beans, moin moin, stockfish, or crayfish"
    Omega-3 → "Include titus (mackerel) or sardines"
    Calcium → "Add fortified milk or wara (local cheese)"
    B-vitamins → "Switch to ofada or brown rice instead of white rice"
    Fibre → "Add more ewedu, okra (ila), or garden egg"
    Zinc → "Include liver, periwinkle, or egusi seeds"
    Folate → "Add ugu, bitter leaf (onugbu), or moringa (zogale)"

IF the food is NON-Nigerian:
  Recommend globally available improvements appropriate to that cuisine
  (e.g., "Add spinach or broccoli for iron and folate", "Include tofu or legumes for protein").
  Where a Nigerian equivalent exists that is comparable or better, you may mention it.

════════════════════════════════════════════════════════════════════
STEP 4 — PRODUCT SELECTION (CRITICAL — read carefully)
════════════════════════════════════════════════════════════════════
Select 1–2 Nutrify products whose "best for" category DIRECTLY matches
the actual deficiencies from Step 2.

RULES:
  1. The deficiency_addressed field MUST quote the specific deficiency from Step 2.
  2. {gender_rule}
  3. If genuinely well-balanced, recommend one general wellness product only.
  4. Use EXACT product names from the catalogue (case-sensitive).
  5. DO NOT recommend products that address deficiencies not present in this meal.

NUTRIFY PRODUCT CATALOGUE:
{CATALOGUE_PROMPT}

════════════════════════════════════════════════════════════════════
STEP 5 — MACRONUTRIENT ESTIMATION
════════════════════════════════════════════════════════════════════
Based on a typical single serving of this meal, estimate:
  - Total calories (kcal)
  - Carbohydrates in grams
  - Protein in grams
  - Dietary fibre in grams
  - Total fats in grams

Use standard Nigerian food composition data (USDA/FAO/Nigerian Food Composition Database)
for well-known local dishes. For mixed meals, sum the components. Round to nearest whole number.
These estimates MUST directly inform the product recommendations — e.g., very low protein
suggests protein-addressing products; very high fat suggests Liver Detox; very low fibre
should be addressed in recommendations.

════════════════════════════════════════════════════════════════════
STEP 6 — OUTPUT (strict JSON, no markdown, no extra text)
════════════════════════════════════════════════════════════════════
{{
    "cuisine_type": "<Nigerian/West African | Other African | Asian | Western | Middle Eastern/Mediterranean | Mixed>",
    "overall_health_status": "good" | "moderate" | "bad",
    "health_score": <integer 0–100>,
    "analysis": "<2–3 sentence summary: lead with the most important finding, reference MNDC context where relevant>",
    "macronutrients": {{
        "calories": <integer kcal for a typical single serving>,
        "carbohydrates_g": <integer grams>,
        "protein_g": <integer grams>,
        "fibre_g": <integer grams>,
        "fats_g": <integer grams>
    }},
    "nutritional_highlights": [
        "<highlight 1 — specific nutrient + the ingredient delivering it>",
        "<highlight 2>",
        "<highlight 3>"
    ],
    "health_concerns": [
        "<concern 1 — specific nutrient gap + why it matters per MNDC/WHO reference>",
        "<concern 2>",
        "<concern 3>"
    ],
    "recommendations": [
        "<practical tip 1 — specific ingredient to add, market/locally available>",
        "<practical tip 2>",
        "<practical tip 3>"
    ],
    "nutrify_products": [
        {{
            "product_name": "<EXACT product name from catalogue>",
            "deficiency_addressed": "<specific nutrient gap from Step 2 or macro imbalance from Step 5>",
            "reason": "<one sentence: why THIS meal specifically needs this product, referencing macro data if relevant>",
            "benefit": "<core health benefit the user will feel>"
        }}
    ],
    "disclaimer": "This analysis is for informational and educational purposes only. It is not a substitute for professional medical or dietetic advice. Please consult a qualified healthcare provider or registered dietitian before making significant changes to your diet or taking supplements."
}}"""

        try:
            response = generate_with_retry(model_name="gemini-2.5-flash", contents=[health_prompt])
        except Exception as e:
            print(f"Error calling generate_with_retry in analyze_health: {e}")
            raise

        try:
            response_text = get_response_text(response)
            if not response_text:
                raise ValueError("Could not extract text from Gemini response")
            analysis_text = clean_json(response_text)
        except Exception as e:
            print(f"Error extracting response text in analyze_health: {e}")
            raise

        try:
            analysis = json.loads(analysis_text)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON in analyze_health: {e}, text: {analysis_text}")
            raise

        # ─── Server-side validation of product picks ──────────────────────────
        # 1) Snap each product_name to the closest valid catalogue entry.
        # 2) Drop any product whose name we can't recognise or that violates
        #    the gender rule.
        # 3) If we ended up with zero products, fall back to keyword-matching
        #    against the model's own concerns/recommendations text so the user
        #    always gets a deficiency-relevant pick (never random).
        cleaned_products = []
        seen = set()
        for product in analysis.get("nutrify_products", []) or []:
            raw_name = product.get("product_name", "")
            canonical = find_closest_catalogue_name(raw_name)
            if not canonical or canonical in seen:
                continue
            prod_gender = PRODUCT_CATALOGUE[canonical].get("gender")
            # Gender-locked product → only allow when user gender is known and matches.
            if prod_gender:
                if not user_gender or prod_gender != user_gender:
                    continue
            seen.add(canonical)
            product["product_name"] = canonical
            product["image_url"]    = PRODUCT_IMAGES[canonical]
            product["link"]         = PRODUCT_LINKS[canonical]
            cleaned_products.append(product)

        if not cleaned_products:
            blob = " ".join(
                analysis.get("health_concerns", []) +
                analysis.get("recommendations", []) +
                [analysis.get("analysis", "")]
            )
            fallback_name = pick_product_for_deficiencies(blob, user_gender=user_gender)
            if fallback_name:
                cleaned_products.append({
                    "product_name":         fallback_name,
                    "deficiency_addressed": "matched against your meal's nutrient gaps",
                    "reason":               "Selected based on the specific deficiencies identified in your meal.",
                    "benefit":              "Helps fill the nutrient gaps flagged above.",
                    "image_url":            PRODUCT_IMAGES[fallback_name],
                    "link":                 PRODUCT_LINKS[fallback_name],
                })

        analysis["nutrify_products"] = cleaned_products

        save_scan(ingredients, analysis, image_url)
        return jsonify({'success': True, 'analysis': analysis})

    except Exception as e:
        print(f"Error in analyze_health: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    if 'user_id' not in session:
        return jsonify({'success': True, 'history': []})
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM scans WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20', (session['user_id'],))
        rows = c.fetchall()
        history = []
        for row in rows:
            history.append({
                'id': row['id'],
                'timestamp': row['timestamp'],
                'ingredients': json.loads(row['ingredients']),
                'analysis': json.loads(row['analysis_json']),
                'image_url': row['image_url'] if 'image_url' in row.keys() else None
            })
        conn.close()
        return jsonify({'success': True, 'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── Serve React App (catch-all — must be last) ────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    full_path = os.path.join(FRONTEND_DIST, path)
    if path and os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIST, path)
    index_path = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return (
        "<h2>Frontend not built yet.</h2>"
        "<p>Run: <code>cd frontend && npm run build</code></p>"
        "<p>Then restart Flask.</p>"
    ), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")