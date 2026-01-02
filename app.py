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
CORS(app)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
DB_FILE = 'nutrify.db'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Setup
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Create Users Table
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

    # Scans Table (Ensure schema is correct)
    # Check if image_url and user_id columns exist, if not recreate (simple dev migration)
    try:
        c.execute('SELECT image_url, user_id FROM scans LIMIT 1')
    except sqlite3.OperationalError:
        # If columns missing, easiest to drop and recreate for this dev stage
        # In prod, we would use ALTER TABLE or migration tool
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

# Initialize DB on startup
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

# Initialize Google Gemini client
client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

def generate_with_retry(model_name, contents):
    """
    Wraps client.models.generate_content with exponential backoff for 429 errors.
    """
    max_retries = 3
    base_delay = 2  # seconds
    
    for attempt in range(max_retries + 1):
        try:
            return client.models.generate_content(
                model=model_name,
                contents=contents
            )
        except exceptions.ResourceExhausted:
            if attempt == max_retries:
                raise
            
            # Exponential backoff + jitter: 2s, 4s, 8s... (+ random ms)
            sleep_time = (base_delay * (2 ** attempt)) + (random.randint(0, 1000) / 1000)
            print(f"Quota exceeded. Retrying in {sleep_time:.2f} seconds...")
            time.sleep(sleep_time)
        except Exception as e:
            # Re-raise other exceptions immediately
            raise e

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Auth Routes ---

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

# --- End Auth Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/analyze-food', methods=['POST'])
def analyze_food():
    # Optional: Enforce auth?
    # if 'user_id' not in session: return jsonify({'error': 'Login required'}), 401
    
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to filename to prevent collisions
            filename = f"{int(time.time())}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Upload file to Gemini
            my_file = client.files.upload(file=filepath)
            
            # Get ingredients list
            ingredients_prompt = """List out all the ingredients in this food image. 
            Return ONLY a JSON array of ingredient names, nothing else.
            Format: ["ingredient1", "ingredient2", "ingredient3"]
            Be specific and detailed about each ingredient you can identify."""
            
            response = generate_with_retry(
                model_name="gemini-2.5-flash",
                contents=[my_file, ingredients_prompt]
            )
            
            # Parse ingredients
            ingredients_text = response.text.strip()
            # Remove markdown code blocks if present
            if ingredients_text.startswith('```'):
                ingredients_text = ingredients_text.split('\n', 1)[1]
                ingredients_text = ingredients_text.rsplit('```', 1)[0]
            
            ingredients = json.loads(ingredients_text)
            
            # DO NOT remove filepath, we want to keep it for history
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
        
        # Customize prompt based on user profile if available
        user_context = ""
        if 'user_id' in session:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT age, gender, height, weight FROM users WHERE id = ?', (session['user_id'],))
            user = c.fetchone()
            conn.close()
            if user:
                 user_context = f"The user is a {user['age']} year old {user['gender']}."

        # Create comprehensive health analysis prompt
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
    "dufil_products": [
        {{
            "product_name": "name of DUFIL product",
            "reason": "Very brief reason",
            "benefit": "Core benefit"
        }}
    ],
    "tolaram_products": [
        {{
            "product_name": "name of Tolaram product",
            "usage": "Brief usage tip",
            "benefit": "Core benefit"
        }}
    ]
}}

Keep the language simple, direct, and easy to read. Avoid long medical jargon.
Return ONLY valid JSON, no additional text."""

        response = generate_with_retry(
            model_name="gemini-2.5-flash",
            contents=[health_prompt]
        )
        
        # Parse response
        analysis_text = response.text.strip()
        # Remove markdown code blocks if present
        if analysis_text.startswith('```'):
            analysis_text = analysis_text.split('\n', 1)[1]
            analysis_text = analysis_text.rsplit('```', 1)[0]
        
        analysis = json.loads(analysis_text)
        
        # Save to History
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
        return jsonify({'success': True, 'history': []}) # Return empty if not logged in

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)