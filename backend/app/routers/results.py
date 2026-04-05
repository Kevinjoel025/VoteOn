"""
Results Router
Handles election results viewing
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate, Vote, User, UserRole
from app.schemas.results import VoterResultsResponse, CandidateResultResponse
from app.middleware.auth import get_optional_current_user, get_current_admin

router = APIRouter()


@router.get("/voter", response_model=VoterResultsResponse)
async def get_voter_results(
    db: Session = Depends(get_db)
):
    """
    Get election results (limited view for voters)
    
    - Shows candidate standings and vote counts
    - Public endpoint (no authentication required)
    - Real-time results
    """
    # Get all approved candidates with votes
    candidates = db.query(Candidate).filter(Candidate.approved == True).all()
    
    # Calculate total votes
    total_votes = db.query(Vote).filter(Vote.is_valid == True).count()
    
    # Calculate total users for turnout
    total_users = db.query(User).count()
    turnout = (total_votes / total_users * 100) if total_users > 0 else 0
    
    # Build candidate results
    candidate_results = []
    for candidate in candidates:
        percentage = (candidate.vote_count / total_votes * 100) if total_votes > 0 else 0
        candidate_results.append({
            "id": candidate.id,
            "name": candidate.name,
            "position": candidate.position,
            "vote_count": candidate.vote_count,
            "percentage": round(percentage, 2),
            "photo_url": candidate.photo_url
        })
    
    # Sort by vote count (highest first)
    candidate_results.sort(key=lambda x: x["vote_count"], reverse=True)
    
    return {
        "candidates": candidate_results,
        "total_votes": total_votes,
        "turnout_percentage": round(turnout, 2),
        "voting_status": "active",
        "message": "Results are being updated in real-time"
    }


@router.get("/admin/full")
async def get_admin_full_results(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive election results (admin only)
    
    - Shows detailed candidate results
    - Demographics and regional breakdowns
    - Vote trends and analytics
    """
    # Get all candidates with detailed vote data
    candidates = db.query(Candidate).filter(Candidate.approved == True).all()
    
    # Calculate totals
    total_votes = db.query(Vote).filter(Vote.is_valid == True).count()
    total_users = db.query(User).count()
    turnout = (total_votes / total_users * 100) if total_users > 0 else 0
    
    # Build detailed candidate results
    candidate_results = []
    for candidate in candidates:
        percentage = (candidate.vote_count / total_votes * 100) if total_votes > 0 else 0
        
        # Get votes by region (simplified - using IP for demo)
        regional_votes = db.query(Vote).filter(
            Vote.candidate_id == candidate.id,
            Vote.is_valid == True
        ).all()
        
        candidate_results.append({
            "id": candidate.id,
            "name": candidate.name,
            "position": candidate.position,
            "party": getattr(candidate, 'party', 'Independent'),
            "vote_count": candidate.vote_count,
            "percentage": round(percentage, 2),
            "photo_url": candidate.photo_url,
            "bio": candidate.bio,
            "manifesto": candidate.manifesto
        })
    
    # Sort by vote count
    candidate_results.sort(key=lambda x: x["vote_count"], reverse=True)
    
    # Get vote trends (daily aggregation)
    from sqlalchemy import func, Date
    daily_votes = db.query(
        func.date(Vote.timestamp).label('date'),
        func.count(Vote.id).label('count')
    ).filter(Vote.is_valid == True).group_by(
        func.date(Vote.timestamp)
    ).all()
    
    vote_trends = [
        {
            "date": str(trend.date),
            "votes": trend.count
        }
        for trend in daily_votes
    ]
    
    # Demographics (simplified - by user creation patterns)
    total_voters = db.query(User).filter(User.role == UserRole.VOTER).count()
    
    # Fraud statistics
    suspicious_votes = db.query(Vote).filter(Vote.is_suspicious == True).count()
    flagged_votes = db.query(Vote).filter(Vote.is_valid == False).count()
    
    return {
        "candidates": candidate_results,
        "summary": {
            "total_votes": total_votes,
            "total_voters": total_voters,
            "turnout_percentage": round(turnout, 2),
            "voting_status": "active"
        },
        "analytics": {
            "vote_trends": vote_trends,
            "fraud_statistics": {
                "suspicious_votes": suspicious_votes,
                "flagged_votes": flagged_votes,
                "clean_votes": total_votes - suspicious_votes
            }
        }
    }
