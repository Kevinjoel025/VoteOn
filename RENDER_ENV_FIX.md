# CORS Configuration Fix for Render

## Error Analysis
```
pydantic_settings.sources.SettingsError: error parsing value for field "CORS_ORIGINS" from source "EnvSettingsSource"
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

## Root Cause
The CORS_ORIGINS environment variable is either:
- Not set in Render
- Set to empty string
- Has wrong format

## Solution: Fix Environment Variables in Render

### Step 1: Go to Render Dashboard
1. Open render.com
2. Click your VoteOn web service
3. Click "Environment" tab

### Step 2: Add/Fix CORS_ORIGINS
**Key**: `CORS_ORIGINS`
**Value**: `http://localhost:5173,http://localhost:3000`

### Step 3: Add All Required Environment Variables

Make sure you have these exact variables:

```
SECRET_KEY=your-32-character-secret-key-here-change-this
DATABASE_URL=your-supabase-connection-string
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_LOGIN=5
RATE_LIMIT_GENERAL=100
ENABLE_SECURITY_HEADERS=true
LOG_LEVEL=INFO
```

### Step 4: Save and Redeploy
1. Click "Save Changes"
2. Manual deploy or auto-deploy will trigger

## Expected Result After Fix
```
==> Running 'uvicorn main:app --host 0.0.0.0 --port 10000'
INFO:     Started server process
INFO:     Waiting for application startup.
✅ VoteOn API started successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

## Alternative: Minimal Environment Variables
If still having issues, start with minimal config:

```
SECRET_KEY=your-secret-key-32-characters-long
DATABASE_URL=postgresql://your-supabase-url
ENVIRONMENT=production
DEBUG=false
```

Then add others one by one to identify issues.

## Quick Test Commands
After fixing:
```bash
# Check health
curl https://your-app.onrender.com/api/health

# Check detailed health  
curl https://your-app.onrender.com/api/health/detailed
```