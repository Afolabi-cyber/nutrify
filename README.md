# Nutrify

## Setup & Run

### 1. Place your credentials
Put your Google service account JSON file in this folder (next to app.py).
Make sure your .env file has the correct filename:
```
GOOGLE_CREDENTIALS_FILE=your-service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id
```

### 2. Install Python dependencies
```
pip install -r requirements.txt
```

### 3. Install frontend dependencies & build
```
cd frontend
npm install
npm run build
cd ..
```

### 4. Run the app
```
python app.py
```

Open http://localhost:5000
