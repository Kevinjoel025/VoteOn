"""
Vote Schemas
Pydantic models for voting requests and responses
"""

from pydantic import BaseModel, Field


class VoteRequest(BaseModel):
    """Vote casting request"""
    candidate_id: int = Field(..., gt=0)
    password: str = Field(..., description="User password for re-authentication")
    device_info: dict = Field(default={}, description="Device fingerprint data")


class VoteResponse(BaseModel):
    """Vote confirmation response"""
    message: str
    receipt_id: str
    candidate_name: str
    timestamp: str
    blockchain_hash: str = Field(default="0x0000...0000", description="Simulated blockchain hash")


class VoteStatsResponse(BaseModel):
    """Voting statistics"""
    total_votes: int
    total_voters: int
    candidate_count: int
    user_has_voted: bool
    turnout_percentage: float
