# VoteOn Backend - Render Deployment Guide

## Pre-Deployment Checklist ✅

### 1. Code Ready
- [x] FastAPI application complete
- [x] Database models defined
- [x] Authentication system implemented
- [x] Security middleware configured
- [x] Environment variable support
- [x] Health check endpoints
- [x] Requirements.txt updated

### 2. Push to GitHub
```bash
# Commit all changes
git add .
git commit -m "Production-ready backend with security, monitoring, and deployment config"
git push origin main
```

---

## Render Deployment Steps

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository

### Step 2: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. **Name**: `voteon-database`
3. **Database**: `voteon_prod`
4. **User**: `voteon_user`
5. **Region**: Choose closest to your users
6. **Plan**: 
   - **Free**: 90 days, then $7/month
   - **Starter**: $7/month (recommended for production)
7. Click "Create Database"
8. **Save the connection string** - you'll need it for the web service

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `VoteOn`
3. **Configuration**:
   - **Name**: `voteon-api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: 
     - **Free**: 750 hours/month, then sleeps
     - **Starter**: $7/month (recommended - no sleep)

### Step 4: Environment Variables
Add these in Render dashboard under "Environment":

**Essential Variables**:
```
SECRET_KEY=generate-a-32-character-secure-key-here
DATABASE_URL=[paste from PostgreSQL service]
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://localhost:5173,https://your-app.netlify.app
```

**Security Variables**:
```
RATE_LIMIT_LOGIN=5
RATE_LIMIT_GENERAL=100
ENABLE_SECURITY_HEADERS=true
LOG_LEVEL=INFO
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start the application
3. **Deployment takes 5-10 minutes**

---

## Post-Deployment Verification

### 1. Check Health
```bash
curl https://your-app-name.onrender.com/api/health
```
**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-03T21:49:31.196Z",
  "service": "VoteOn API",
  "version": "1.0.0"
}
```

### 2. Check Database Connection
```bash
curl https://your-app-name.onrender.com/api/health/detailed
```

### 3. Test API Documentation
Visit: `https://your-app-name.onrender.com/docs`

### 4. Create Admin User
```bash
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "SecureAdminPassword123!"
  }'
```

### 5. Test Key Endpoints
```bash
# Get candidates
curl https://your-app-name.onrender.com/api/candidates

# Check metrics
curl https://your-app-name.onrender.com/api/metrics
```

---

## Production Configuration Tips

### 1. Custom Domain (Optional)
- Add custom domain in Render dashboard
- Configure DNS records
- SSL certificate automatically provisioned

### 2. Database Backups
- Enable automated backups in PostgreSQL service
- Render provides daily backups on paid plans

### 3. Monitoring
- Check logs in Render dashboard
- Set up alerts for downtime
- Monitor `/api/metrics` endpoint

### 4. Security Hardening
✅ **Already implemented**:
- Rate limiting
- Security headers
- Input validation
- JWT authentication
- CORS protection
- SQL injection prevention

---

## Troubleshooting

### Common Issues:
1. **Build fails**: Check requirements.txt syntax
2. **Database connection**: Verify DATABASE_URL format
3. **CORS errors**: Update CORS_ORIGINS with frontend URL
4. **App sleeps**: Upgrade to paid plan to prevent sleeping

### Debug Commands:
```bash
# Check logs
curl https://your-app-name.onrender.com/api/health/detailed

# Test database
curl https://your-app-name.onrender.com/api/metrics
```

---

## Next Steps After Backend Deployment

1. ✅ **Backend deployed and tested**
2. 🔄 **Update frontend API URLs**
3. 🔄 **Connect React components to live API**
4. 🔄 **Deploy frontend to Netlify**
5. 🔄 **Final production testing**

**Your backend will be live and ready for frontend integration!** 🎉