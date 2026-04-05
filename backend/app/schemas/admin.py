"""
Admin Schemas
Pydantic models for admin operations
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AdminNominationResponse(BaseModel):
    """Detailed nomination view for admins"""
    id: int
    user_id: int
    username: str
    email: str
    position: str
    bio: str
    manifesto: str
    documents: Optional[List[str]] = None
    endorsers: Optional[List[int]] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True


class NominationActionRequest(BaseModel):
    """Admin action on nomination"""
    action: str = Field(..., description="'approve' or 'reject'")
    admin_notes: Optional[str] = Field(None, description="Optional notes for rejection")


class SuspiciousVoteResponse(BaseModel):
    """Suspicious vote details for admin"""
    id: int
    receipt_id: str
    user_id: int
    username: str
    candidate_id: int
    candidate_name: str
    risk_score: float
    is_suspicious: bool
    device_id: Optional[str]
    ip_address: Optional[str]
    timestamp: str
    is_valid: bool


class VoteActionRequest(BaseModel):
    """Admin action on vote"""
    action: str = Field(..., description="'invalidate' or 'clear_flag'")


class AdminUserResponse(BaseModel):
    """User details for admin"""
    id: int
    username: str
    email: str
    role: str
    has_voted: bool
    is_active: bool
    device_id: Optional[str]
    ip_address: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class UserActionRequest(BaseModel):
    """Admin action on user"""
    action: str = Field(..., description="'block' or 'unblock' or 'delete'")


class AdminDashboardResponse(BaseModel):
    """Admin dashboard statistics"""
    total_users: int
    total_votes: int
    suspicious_votes: int
    pending_nominations: int
    active_candidates: int
    turnout_percentage: float
    recent_activity: List[dict]


class AdminAnalyticsResponse(BaseModel):
    """Detailed analytics for admin"""
    vote_trends: List[dict]
    regional_breakdown: List[dict]
    fraud_statistics: dict
    user_statistics: dict