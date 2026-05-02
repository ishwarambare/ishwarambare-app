# ishwarambare-app – Full-Stack FastAPI + React

> Domain: **ishwarambare.online** · Deployed on **Render**

## 🗂 Project Structure

```
ishwarambare-app/
├── backend/          # FastAPI Python backend
│   ├── venv/         # Virtual environment (not committed)
│   ├── routers/
│   │   ├── items.py
│   │   └── auth.py
│   ├── main.py
│   └── requirements.txt
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   └── styles/
│   ├── vite.config.js
│   └── package.json
└── render.yaml       # Render deployment blueprint
```

---

## 🚀 Local Development

### Prerequisites
- Python 3.14+
- Node.js 18+

### 1 – Backend

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment file
copy .env.example .env

# Run FastAPI dev server
uvicorn main:app --reload --port 8000
```

API docs auto-available at: http://localhost:8000/docs

### 2 – Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and edit environment file
copy .env.example .env.local

# Run Vite dev server
npm run dev
```

Frontend runs at: http://localhost:5173  
(API calls proxied to http://localhost:8000)

---

## ☁️ Deploy to Render

### Automatic (Blueprint)

1. Push this repo to **GitHub**
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo → Render reads `render.yaml` and creates both services

### Manual (Environment Variables)

| Service  | Key | Value |
|---|---|---|
| Backend  | `ALLOWED_ORIGINS` | `https://ishwarambare.online,https://www.ishwarambare.online` |
| Backend  | `SECRET_KEY` | (generate: `openssl rand -hex 32`) |
| Frontend | `VITE_API_URL` | `https://ishwarambare-api.onrender.com` |

---

## 🌐 Custom Domain Setup

1. In Render → **Frontend service → Settings → Custom Domains**
2. Add `ishwarambare.online` and `www.ishwarambare.online`
3. Update your DNS registrar:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `ishwarambare-frontend.onrender.com` |
| A | `@` | *(Render's IP shown in dashboard)* |

4. Wait for SSL certificate to provision (~5 min)

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| GET | `/api/items/` | List all items |
| GET | `/api/items/{id}` | Get item by ID |
| POST | `/api/items/` | Create item |
| DELETE | `/api/items/{id}` | Delete item |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |

---

## 🔒 .gitignore

Make sure to **never commit** `.env`, `venv/`, or `node_modules/`.
