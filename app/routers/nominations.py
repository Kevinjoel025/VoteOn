"""
Nominations Router
Handles candidate nomination applications
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Nomination, NominationStatus
from app.schemas.nomination import NominationRequest, NominationResponse, NominationStatusResponse
from app.middleware.auth import get_current_user
import json

router = APIRouter()


@router.post("/apply", response_model=NominationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_nomination(
    request: NominationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply for candidate nomination
    
    - Requires authentication
    - Users can only have one active nomination
    - Includes bio, manifesto, endorsers, and documents
    """
    # Check if user already has a nomination
    existing = db.query(Nomination).filter(Nomination.user_id == user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a nomination application (Status: {existing.status.value})"
        )
    
    # Create nomination
    new_nomination = Nomination(
        user_id=user.id,
        position=request.position,
        bio=request.bio,
        manifesto=request.manifesto,
        documents=json.dumps(request.documents) if request.documents else None,
        endorsers=json.dumps(request.endorser_ids) if request.endorser_ids else None,
        status=NominationStatus.PENDING
    )
    
    db.add(new_nomination)
    db.commit()
    db.refresh(new_nomination)
    
    return {
        "id": new_nomination.id,
        "position": new_nomination.position,
        "bio": new_nomination.bio,
        "manifesto": new_nomination.manifesto,
        "status": new_nomination.status.value,
        "admin_notes": new_nomination.admin_notes,
        "created_at": new_nomination.created_at.isoformat() if new_nomination.created_at else None
    }


@router.get("/my-nomination", response_model=NominationStatusResponse)
async def get_my_nomination(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's nomination status
    
    - Requires authentication
    - Returns nomination details if exists
    """
    nomination = db.query(Nomination).filter(Nomination.user_id == user.id).first()
    
    if not nomination:
        return {
            "has_applied": False,
            "nomination": None,
            "message": "You have not applied for nomination yet"
        }
    
    return {
        "has_applied": True,
        "nomination": {
            "id": nomination.id,
            "position": nomination.position,
            "bio": nomination.bio,
            "manifesto": nomination.manifesto,
            "status": nomination.status.value,
            "admin_notes": nomination.admin_notes,
            "created_at": nomination.created_at.isoformat() if nomination.created_at else None
        },
        "message": f"Your nomination is {nomination.status.value}"
    }
