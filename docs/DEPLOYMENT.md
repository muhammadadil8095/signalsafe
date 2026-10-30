# SignalSafe Campus — Deployment Guide

## 1. Local Development Setup

### Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Seed the database with demo users and sample scans:
python -m app.database.seed

# Run the FastAPI development server:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## 2. Docker Compose Deployment

Run both backend and frontend concurrently:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API & Docs: `http://localhost:8000/docs`

---

## 3. Seed Accounts
- **Admin**: `admin@signalsafe.edu` / `admin123`
- **Student**: `student@campus.edu` / `student123`
- **Faculty**: `faculty@campus.edu` / `faculty123`

