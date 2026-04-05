"""
Votes Router
Handles vote casting and statistics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Vote, Candidate, UserRole
from app.schemas.vote import VoteRequest, VoteResponse, VoteStatsResponse
from app.middleware.auth import get_current_user
from app.services.vote_service import VoteService
from app.utils.security import verify_password

router = APIRouter()


@router.post("/", response_model=VoteResponse)
async def cast_vote(
    request_data: VoteRequest,
    req: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cast a vote
    
    - Requires authentication
    - Requires password re-authentication for security
    - One vote per user
    - Includes fraud detection
    """
    # Re-authenticate user with password
    if not verify_password(request_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please re-enter your password to confirm vote."
        )
    
    # Get client IP address
    ip_address = req.client.host if req.client else "unknown"
    
    # Cast vote using service
    vote_service = VoteService()
    result = vote_service.cast_vote(
        user=user,
        candidate_id=request_data.candidate_id,
        device_info=request_data.device_info,
        ip_address=ip_address,
        db=db
    )
    
    return result


@router.get("/stats", response_model=VoteStatsResponse)
async def get_vote_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get voting statistics
    
    - Requires authentication
    - Returns total votes and user voting status
    """
    total_votes = db.query(Vote).filter(Vote.is_valid == True).count()
    total_users = db.query(User).filter(User.role == UserRole.VOTER).count()
    candidate_count = db.query(Candidate).filter(Candidate.approved == True).count()
    
    turnout = (total_votes / total_users * 100) if total_users > 0 else 0
    
    return {
        "total_votes": total_votes,
        "total_voters": total_users,
        "candidate_count": candidate_count,
        "user_has_voted": user.has_voted,
        "turnout_percentage": round(turnout, 2)
    }
