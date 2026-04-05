"""
FastAPI Application Entry Point
VoteOn - AI-Enhanced Community Voting Platform
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, candidates, votes, results, nominations, admin, upload


app = FastAPI(
    title="VoteOn API",
    description="AI-Enhanced Community Voting Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Session middleware must be added LAST (innermost or outermost depending on FastAPI version, but standard is here)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Proper pure-ASGI CORS Middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)


@app.get("/")
async def root(request: Request):
    """Root endpoint"""
    try:
        request.session["test"] = "works"
        has_session = True
    except Exception as e:
        has_session = str(e)
    return {
        "message": "VoteOn API",
        "version": "1.0.0",
        "status": "running",
        "has_session": has_session
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(votes.router, prefix="/api/vote", tags=["Voting"])
app.include_router(results.router, prefix="/api/results", tags=["Results"])
app.include_router(nominations.router, prefix="/api/nominations", tags=["Nominations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password


@app.on_event("startup")
async def ensure_admin_credentials():
    """
    Ensure the admin account exists with the correct credentials.
    Updates existing old admin accounts and creates fresh if needed.
    """
    db = SessionLocal()
    try:
        new_email = "Kevin@admin.com"
        new_password = "admin123"
        new_hash = hash_password(new_password)

        # Check if the target admin already exists
        admin = db.query(User).filter(User.email == new_email).first()
        if admin:
            # Already correct — update password hash in case it changed
            admin.password_hash = new_hash
            admin.role = UserRole.ADMIN
            admin.is_active = True
            db.commit()
            return

        # Check for old admin accounts to migrate
        old_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if old_admin:
            old_admin.email = new_email
            old_admin.password_hash = new_hash
            old_admin.is_active = True
            db.commit()
        else:
            # Create fresh admin
            new_admin = User(
                username="admin",
                email=new_email,
                password_hash=new_hash,
                role=UserRole.ADMIN,
                is_active=True,
                has_voted=False
            )
            db.add(new_admin)
            db.commit()
    except Exception as e:
        print(f"Warning: Could not ensure admin credentials: {e}")
    finally:
        db.close()
