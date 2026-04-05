"""
Health Check and Monitoring Endpoints
Provides system health status and monitoring capabilities
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import User, Vote, Candidate
from datetime import datetime, timedelta
import psutil
import time

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint
    Returns system status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "VoteOn API",
        "version": "1.0.0"
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """
    Detailed health check including database connectivity
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "VoteOn API",
        "version": "1.0.0",
        "checks": {}
    }
    
    # Database connectivity check
    try:
        db.execute(text("SELECT 1"))
        health_data["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # System resources check
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_data["checks"]["system"] = {
            "status": "healthy" if cpu_percent < 80 and memory.percent < 80 else "warning",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "available_memory_gb": round(memory.available / (1024**3), 2)
        }
    except Exception as e:
        health_data["checks"]["system"] = {
            "status": "unknown",
            "message": f"Could not get system stats: {str(e)}"
        }
    
    return health_data


@router.get("/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    """
    Application metrics for monitoring
    """
    try:
        # Database metrics
        total_users = db.query(User).count()
        total_votes = db.query(Vote).count()
        total_candidates = db.query(Candidate).count()
        
        # Recent activity metrics (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_users = db.query(User).filter(User.created_at >= yesterday).count()
        recent_votes = db.query(Vote).filter(Vote.timestamp >= yesterday).count()
        
        # Suspicious activity metrics
        suspicious_votes = db.query(Vote).filter(Vote.is_suspicious == True).count()
        
        # Voter turnout
        active_users = db.query(User).filter(User.role == "voter").count()
        turnout_percentage = (total_votes / active_users * 100) if active_users > 0 else 0
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "total_users": total_users,
                "total_votes": total_votes,
                "total_candidates": total_candidates,
                "turnout_percentage": round(turnout_percentage, 2)
            },
            "activity_24h": {
                "new_users": recent_users,
                "new_votes": recent_votes
            },
            "security": {
                "suspicious_votes": suspicious_votes,
                "suspicious_percentage": round((suspicious_votes / total_votes * 100) if total_votes > 0 else 0, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not retrieve metrics: {str(e)}"
        )


@router.get("/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check for Kubernetes/container orchestration
    """
    try:
        # Check database connectivity
        db.execute(text("SELECT 1"))
        
        # Check if essential data exists (at least one admin user)
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count == 0:
            return {
                "status": "not_ready",
                "reason": "No admin users found - database may not be seeded"
            }
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "not_ready",
            "reason": f"Database not accessible: {str(e)}"
        }


@router.get("/liveness")
async def liveness_check():
    """
    Liveness check for Kubernetes/container orchestration
    Simple check to ensure the application is running
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": time.time()
    }