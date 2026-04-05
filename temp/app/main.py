"""
FastAPI Application Entry Point
VoteOn - AI-Enhanced Community Voting Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, candidates, votes, results, nominations, admin, upload

app = FastAPI(
    title="VoteOn API",
    description="AI-Enhanced Community Voting Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "VoteOn API",
        "version": "1.0.0",
        "status": "running"
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


