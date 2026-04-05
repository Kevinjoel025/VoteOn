# Supabase + Render Connection Guide

## Step 1: Get Supabase Database URL

### 1.1 Go to Supabase Dashboard
- Open: **supabase.com**
- Sign in to your account
- Click on your project (or create new project if you don't have one)

### 1.2 Get Connection String
- Go to **Settings** → **Database** (left sidebar)
- Scroll to **Connection string** section
- Copy the **URI** format connection string
- Should look like:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Step 2: Add Database URL to Render

### 2.1 Go to Render Dashboard
- Open: **render.com**
- Click on your **VoteOn API** web service

### 2.2 Add Environment Variable
- Click **"Environment"** tab (left sidebar)
- Click **"Add Environment Variable"**
- **Key**: `DATABASE_URL`
- **Value**: (paste your Supabase connection string)
- Click **"Save Changes"**

### 2.3 Add Other Required Variables
Add these environment variables:

```
SECRET_KEY = your-32-character-secret-key-here
ENVIRONMENT = production
DEBUG = false
CORS_ORIGINS = https://voteon.netlify.app,https://your-app.netlify.app
RATE_LIMIT_LOGIN = 5
RATE_LIMIT_GENERAL = 100
ENABLE_SECURITY_HEADERS = true
LOG_LEVEL = INFO
```

## Step 3: Test Database Connection

### 3.1 Check Health Endpoint
Visit: `https://your-app-name.onrender.com/api/health/detailed`

Should show database status as "healthy"

### 3.2 Check API Documentation
Visit: `https://your-app-name.onrender.com/docs`

Should show all your API endpoints

### 3.3 Create Admin User
```bash
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!"
  }'
```

## Step 4: Run Database Migrations (Optional)

If you need to create tables:
1. SSH to Render (if available)
2. Or use Supabase SQL Editor to run table creation scripts

## 🎯 Expected Result

After setup:
- ✅ Backend connected to Supabase
- ✅ All API endpoints working
- ✅ Database tables created
- ✅ Ready for frontend integration

## Troubleshooting

### Database Connection Issues:
- Check Supabase project is not paused
- Verify connection string format
- Ensure password is URL-encoded (@ becomes %40)

### Authentication Issues:
- Check SECRET_KEY is set
- Verify all environment variables added