"""
Nomination Schemas
Pydantic models for nomination requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class NominationRequest(BaseModel):
    """Nomination application request"""
    position: str = Field(..., max_length=100)
    bio: str = Field(..., min_length=50, max_length=1000)
    manifesto: str = Field(..., min_length=100, max_length=5000)
    endorser_ids: List[int] = Field(default=[], description="List of user IDs who endorse")
    documents: List[str] = Field(default=[], description="URLs of uploaded documents")


class NominationResponse(BaseModel):
    """Nomination status response"""
    id: int
    position: str
    bio: str
    manifesto: str
    status: str  # pending, approved, rejected
    admin_notes: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


class NominationStatusResponse(BaseModel):
    """User's nomination status"""
    has_applied: bool
    nomination: Optional[NominationResponse] = None
    message: str
