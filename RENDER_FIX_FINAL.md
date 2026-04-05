# Render Deployment - Final Fix Guide

## ✅ Dependencies: SUCCESSFUL
All Python packages installed successfully!

## ❌ Current Issue: Start Command
```
ERROR: Error loading ASGI app. Could not import module "main".
```

## 🔧 Root Cause
Render is running: `uvicorn main:app`
But FastAPI app is at: `backend/app/main.py`

## 🚀 Solution: Fix Render Configuration

### Method 1: Update Render Dashboard Settings
1. Go to Render Dashboard → Your Web Service
2. Click "Settings" tab
3. Update "Build & Deploy" section:

**Build Command**:
```bash
cd backend && pip install -r requirements.txt
```

**Start Command**:
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

4. Save Changes → Manual Deploy

### Method 2: Use Procfile (Backup)
If settings don't work, commit the `Procfile` in root:
```
web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## 📍 File Structure Verification
```
VoteOn/
├── runtime.txt                 ✅ (forces Python 3.11.9)
├── Procfile                    ✅ (backup start command)  
├── backend/
│   ├── requirements.txt        ✅ (dependencies working)
│   ├── app/
│   │   └── main.py            ✅ (FastAPI app location)
│   └── ...
└── src/ (frontend)
```

## 🎯 Expected Result After Fix
```bash
==> Running 'cd backend && uvicorn app.main:app --host 0.0.0.0 --port 10000'
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

## 🔍 Supabase Database Setup
While fixing the start command, also set up Supabase:

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Copy Connection String** (URI format):
```
postgresql://postgres.xxxxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
3. **Add to Render Environment Variables** as `DATABASE_URL`

## ✅ Final Deployment Checklist
- [ ] Start command updated in Render
- [ ] Supabase DATABASE_URL configured  
- [ ] Environment variables added
- [ ] Manual deploy triggered
- [ ] Health check: `https://your-app.onrender.com/api/health`

**After this fix, your backend will be 100% live!** 🎉