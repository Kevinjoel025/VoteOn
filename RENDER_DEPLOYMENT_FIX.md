# Render + Supabase Deployment Fix Guide

## Issue Analysis
The deployment is failing because:
1. ❌ Runtime.txt format incorrect for Render
2. ❌ Pydantic version incompatible with Python 3.14
3. ❌ Missing Supabase configuration
4. ❌ Rust compilation errors with pydantic-core

## Fixed Files Created ✅

### 1. runtime.txt (Root Directory)
```
python-3.11.9
```
**Location**: `d:\Projects\VoteOn\runtime.txt` (NOT in backend folder!)

### 2. Updated requirements.txt  
- Downgraded pydantic to 2.5.3 (compatible with Python 3.11)
- Removed problematic dependencies
- Added explicit pydantic version

## Render Configuration Steps

### Step 1: File Structure Fix
```
VoteOn/
├── runtime.txt              ← Must be in ROOT directory
├── backend/
│   ├── requirements.txt     ← Updated versions
│   ├── app/
│   └── ...
└── src/ (frontend)
```

### Step 2: Render Settings
1. **Root Directory**: Leave blank (uses repo root)
2. **Build Command**: `cd backend && pip install -r requirements.txt`
3. **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Supabase Database URL
Instead of Render PostgreSQL, use Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Copy connection string (looks like):
```
postgresql://postgres.xxxxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Step 4: Environment Variables (Render)
```
SECRET_KEY=your-32-character-secret-key-here
DATABASE_URL=postgresql://postgres.xxxxx:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://voteon.netlify.app,https://your-app.netlify.app
RATE_LIMIT_LOGIN=5
RATE_LIMIT_GENERAL=100
ENABLE_SECURITY_HEADERS=true
LOG_LEVEL=INFO
```

## Alternative Solutions

### Option A: Use Python 3.11 Explicitly
Update Render settings:
- **Runtime**: Python 3.11
- **Environment Variable**: `PYTHON_VERSION=3.11.9`

### Option B: Simplified Requirements
If still failing, try minimal requirements:
```txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
bcrypt==4.0.1
pydantic==2.5.3
python-dotenv==1.0.0
```

### Option C: Alternative Hosting
If Render continues having issues:
- **Railway**: Better Python 3.11 support
- **Fly.io**: More reliable builds
- **Heroku**: Stable but paid

## Troubleshooting Checklist

### ✅ Pre-Deployment
- [ ] runtime.txt in ROOT directory (not backend/)
- [ ] Updated requirements.txt with compatible versions
- [ ] Supabase database URL copied
- [ ] All files committed to GitHub

### ✅ Render Configuration  
- [ ] Build command: `cd backend && pip install -r requirements.txt`
- [ ] Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables added
- [ ] Python 3.11 selected

### ✅ Common Fixes
- [ ] Clear Render cache (redeploy)
- [ ] Check GitHub files are pushed
- [ ] Verify Supabase database is active
- [ ] Test locally with Python 3.11

## Quick Deploy Commands

```bash
# 1. Add files to root
git add runtime.txt
git add backend/requirements.txt

# 2. Commit changes  
git commit -m "Fix: Python 3.11 runtime and compatible dependencies for Render deployment"

# 3. Push to GitHub
git push origin main

# 4. Redeploy on Render (manual trigger)
```

The main fixes are:
1. **runtime.txt in root directory**
2. **Compatible pydantic version**  
3. **Correct build/start commands**
4. **Supabase DATABASE_URL**