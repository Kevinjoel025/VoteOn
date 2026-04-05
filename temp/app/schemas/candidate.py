"""
Candidate Schemas
Pydantic models for candidate requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional


class CandidateBase(BaseModel):
    """Base candidate information"""
    name: str = Field(..., min_length=2, max_length=100)
    position: str = Field(..., max_length=100)
    bio: Optional[str] = None
    manifesto: Optional[str] = None
    photo_url: Optional[str] = None


class CandidateCreate(CandidateBase):
    """Create new candidate (admin only)"""
    pass


class CandidateResponse(CandidateBase):
    """Candidate response for voters"""
    id: int
    vote_count: int
    approved: bool
    
    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    """List of candidates"""
    candidates: list[CandidateResponse]
    total: int
