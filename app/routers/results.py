"""
Results Router
Handles election results viewing
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate, Vote, User
from app.schemas.results import VoterResultsResponse, CandidateResultResponse
from app.middleware.auth import get_optional_current_user

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
