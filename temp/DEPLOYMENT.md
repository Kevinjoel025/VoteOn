# VoteOn Backend - Deployment Configuration

## Environment Variables (Production)
SECRET_KEY=your-super-secure-secret-key-here-32-chars-min
DATABASE_URL=postgresql://username:password@host:port/database
ENVIRONMENT=production
DEBUG=false

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# Security
RATE_LIMIT_LOGIN=5
RATE_LIMIT_GENERAL=100
ENABLE_SECURITY_HEADERS=true

# CORS (Production domains)
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com

# File Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=5242880

# Logging
LOG_LEVEL=INFO

## Render Deployment Configuration

### Database Setup
1. Create PostgreSQL database on Render
2. Copy connection string to DATABASE_URL
3. Run migrations: `alembic upgrade head`

### Web Service Setup
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from above

### Health Checks
- Health check path: `/api/health`
- Readiness check: `/api/readiness`
- Metrics endpoint: `/api/metrics`

### Production Checklist
- [ ] SECRET_KEY changed from default
- [ ] DEBUG=false
- [ ] DATABASE_URL points to production database
- [ ] CORS_ORIGINS set to production domains
- [ ] Google OAuth configured with production URLs
- [ ] SSL certificates configured
- [ ] Database migrations run
- [ ] Admin user created via seed script

### Performance Recommendations
- Database: At least 1GB RAM, 10GB storage
- Web Service: 512MB RAM minimum, 1GB recommended
- Enable automatic deployments from main branch
- Set up database backups (daily recommended)