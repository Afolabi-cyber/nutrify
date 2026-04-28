from flask import Flask, request, jsonify, render_template, send_from_directory, session
from flask_cors import CORS
from google import genai
from google.api_core import exceptions
from dotenv import load_dotenv
import os
import time
import random
import base64
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import json
import sqlite3
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev_key_very_secret_123')
CORS(
    app,
    origins="*"
)

UPLOAD_FOLDER = 'static/uploads'
DB_FILE = 'nutrify.db'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


PRODUCT_LINKS = {
    "Vitamin C & Zinc": "https://nutrifyng.com/products/vitamin-c-zinc",
    "Immunity Booster": "https://nutrifyng.com/products/immunity-booster",
    "Collagen (Skin, Hair & Nails)": "https://nutrifyng.com/products/collagen-beauty-formula-60-tablets",
    "Menx Performance Support": "https://nutrifyng.com/products/menx-performance-support-tablets-60-tablets",
    "Women's Multivitamin": "https://nutrifyng.com/products/women-s-multivitamin-30-tablets",
    "Men's Multivitamin": "https://nutrifyng.com/products/multivitamin-for-men-60-tablet",
    "Men's 50+ Multivitamin": "https://nutrifyng.com/products/men-s-50-multivitamin-30-tablets",
    "Liver Detox": "https://nutrifyng.com/products/liv-detox-formula",
    "Complete Wellness Trio": "https://nutrifyng.com/products/complete-wellness-trio",
    "Ultimate Beauty & Wellness Pack": "https://nutrifyng.com/products/ultimate-beauty-wellness-pack",
    "Couples Wellness Premium": "https://nutrifyng.com/products/complete-wellness-trio  ",
}
PRODUCT_IMAGES = {
    "Vitamin C & Zinc": "/products/vitamin-c-zinc.png",
    "Liver Detox": "/products/liver-detox.png",
    "Men's Multivitamin": "/products/mens-multivitamin.png",
    "Women's Multivitamin": "/products/womens-multivitamin.png",
    "Men's 50+ Multivitamin": "/products/mens-50-multivitamin.png",
    "Menx Performance Support": "/products/menx-performance-support.png",
    "Complete Wellness Trio": "/products/complete-wellness-trio.png",
    "Immunity Booster": "/products/immunity-booster.png",
    "Collagen (Skin, Hair & Nails)": "/products/collagen.png",
    "Ultimate Beauty & Wellness Pack": "/products/ultimate-beauty-wellness-pack.png",
    "Couples Wellness Premium": "/products/couples-wellness-premium.png",
}


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
        c.execute('INSERT INTO scans (user_id, ingredients, analysis_json, image_url) VALUES (?, ?, ?, ?)',
                  (user_id, json.dumps(ingredients), json.dumps(analysis), image_url))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error saving scan: {e}")


client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))


def generate_with_retry(model_name, contents):
    fallback_models = [model_name, "gemini-2.0-flash", "gemini-1.5-flash"]
    base_delay = 5

    for model in fallback_models:
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                return client.models.generate_content(
                    model=model,
                    contents=contents
                )
            except (exceptions.ResourceExhausted, exceptions.ServiceUnavailable) as e:
                if attempt == max_retries:
                    break
                sleep_time = (base_delay * (2 ** attempt)) + \
                    (random.randint(0, 1000) / 1000)
                print(f"Retrying {model} in {sleep_time:.2f}s...")
                time.sleep(sleep_time)
            except Exception as e:
                raise e

    raise Exception(
        "All models are currently unavailable. Please try again in a few minutes.")


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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
            'email': user['email'],
            'full_name': user['full_name'],
            'age': user['age'],
            'height': user['height'],
            'weight': user['weight'],
            'gender': user['gender']
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
            'email': user['email'],
            'full_name': user['full_name'],
            'age': user['age'],
            'height': user['height'],
            'weight': user['weight'],
            'gender': user['gender']
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
            UPDATE users SET full_name=?, age=?, height=?, weight=?, gender=?
            WHERE id=?
        ''', (data.get('full_name'), data.get('age'), data.get('height'), data.get('weight'), data.get('gender'), session['user_id']))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# @app.route('/products/<path:path>')
# def serve_product_image(path):
#     products_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'public', 'products')
#     return send_from_directory(products_dir, path)


@app.route('/products/<path:path>')
def serve_product_image(path):
    products_dir = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), 'frontend', 'public', 'products')
    return send_from_directory(products_dir, path)


@app.route('/api/analyze-food', methods=['POST'])
def analyze_food():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filename = f"{int(time.time())}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            my_file = client.files.upload(file=filepath)

            ingredients_prompt = """List out all the ingredients in this food image.
            Return ONLY a JSON array of ingredient names, nothing else.
            Format: ["ingredient1", "ingredient2", "ingredient3"]
            Be specific and detailed about each ingredient you can identify.

            CRITICAL: IF THE ITEM SCANNED IS NOT A FOOD, KINDLY RESPOND WITH THIS IS NOT A FOOD."""

            response = generate_with_retry(
                model_name="gemini-2.5-flash",
                contents=[my_file, ingredients_prompt]
            )

            ingredients_text = response.text.strip()
            if ingredients_text.startswith('```'):
                ingredients_text = ingredients_text.split('\n', 1)[1]
                ingredients_text = ingredients_text.rsplit('```', 1)[0]
            if "NOT A FOOD" in ingredients_text.upper():
                 return jsonify({'error': 'not_food', 'message': 'This does not appear to be a food item. Please upload a food image.'}), 400

            ingredients = json.loads(ingredients_text)
            image_url = f"/static/uploads/{filename}"

            return jsonify({
                'success': True,
                'ingredients': ingredients,
                'image_url': image_url
            })

        return jsonify({'error': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-health', methods=['POST'])
def analyze_health():
    try:
        data = request.get_json()
        ingredients = data.get('ingredients', [])
        image_url = data.get('image_url', '')

        if not ingredients:
            return jsonify({'error': 'No ingredients provided'}), 400

        user_context = ""
        if 'user_id' in session:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute(
                'SELECT age, gender, height, weight FROM users WHERE id = ?', (session['user_id'],))
            user = c.fetchone()
            conn.close()
            if user:
                user_context = f"The user is a {user['age']} year old {user['gender']}."

        nutrify_brands = "Vitamin C & Zinc, Liver Detox, Men's Multivitamin, Women's Multivitamin, Men's 50+ Multivitamin, Menx Performance Support, Complete Wellness Trio, Immunity Booster, Collagen (Skin, Hair & Nails), Ultimate Beauty & Wellness Pack, Couples Wellness Premium"
        health_prompt = f"""Analyze these food ingredients based on Nigerian dietary standards: {', '.join(ingredients)}
{user_context}

Please provide a CONCISE and UX-friendly analysis in the following JSON format:
{{
    "overall_health_status": "good" or "bad" or "moderate",
    "health_score": (number between 0-100),
    "analysis": "Short, clear summary (max 2 sentences). Focus on the most important health impact.",
    "nutritional_highlights": ["3-4 key bullet points, keep them short"],
    "health_concerns": ["2-3 main concerns, if any (short bullet points)"],
    "recommendations": ["2-3 practical tips (short bullet points)"],
    "nutrify_products": [
        {{
            "product_name": "name of NUTRIFY product",
            "reason": "Very brief reason why this brand's product is a good addition or alternative",
            "benefit": "Core benefit of using this brand"
        }}
    ]
}}

Always recommend 1 or 2 products from this list:
{nutrify_brands}

Even if the meal is generally healthy, suggest a complementary product.

Do NOT return an empty nutrify_products array. If the meal is unhealthy, recommend a product that can help mitigate the health risks. Be specific in your recommendations. Do not be generic."""

        response = generate_with_retry(
            model_name="gemini-2.5-flash",
            contents=[health_prompt]
        )

        analysis_text = response.text.strip()
        if analysis_text.startswith('```'):
            analysis_text = analysis_text.split('\n', 1)[1]
            analysis_text = analysis_text.rsplit('```', 1)[0]

        analysis = json.loads(analysis_text)

        for product in analysis.get("nutrify_products", []):
            name = product.get("product_name", "")
            product["image_url"] = PRODUCT_IMAGES.get(name, "/products/default.png")
            product["link"] = PRODUCT_LINKS.get(name, "https://nutrifyng.com/collections/all")

        save_scan(ingredients, analysis, image_url)

        return jsonify({
            'success': True,
            'analysis': analysis
        })

    except Exception as e:
        print(f"Error in analyze_health: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    if 'user_id' not in session:
        return jsonify({'success': True, 'history': []})

    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute(
            'SELECT * FROM scans WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20', (session['user_id'],))
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


if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")
