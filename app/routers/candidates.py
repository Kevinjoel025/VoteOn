"""
Candidates Router
Handles candidate listing and management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate
from app.schemas.candidate import CandidateResponse, CandidateListResponse
from typing import List

router = APIRouter()


@router.get("/", response_model=CandidateListResponse)
async def list_candidates(
    approved_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all candidates
    
    - Public endpoint (no authentication required)
    - By default, only shows approved candidates
    """
    query = db.query(Candidate)
    
    # Only show approved candidates
    if approved_only:
        query = query.filter(Candidate.approved == True)
    
    candidates = query.all()
    
    candidate_list = [
        {
            "id": c.id,
            "name": c.name,
            "position": c.position,
            "bio": c.bio,
            "manifesto": c.manifesto,
            "photo_url": c.photo_url,
            "vote_count": c.vote_count,
            "approved": c.approved
        }
        for c in candidates
    ]
    
    return {
        "candidates": candidate_list,
        "total": len(candidate_list)
    }


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific candidate details
    
    - Public endpoint
    - Returns candidate information
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return {
        "id": candidate.id,
        "name": candidate.name,
        "position": candidate.position,
        "bio": candidate.bio,
        "manifesto": candidate.manifesto,
        "photo_url": candidate.photo_url,
        "vote_count": candidate.vote_count,
        "approved": candidate.approved
    }
