"""
Results Schemas
Pydantic models for election results
"""

from pydantic import BaseModel
from typing import List, Optional


class CandidateResultResponse(BaseModel):
    """Candidate result with vote count"""
    id: int
    name: str
    position: str
    vote_count: int
    percentage: float
    photo_url: Optional[str] = None


class VoterResultsResponse(BaseModel):
    """Limited results view for voters"""
    candidates: List[CandidateResultResponse]
    total_votes: int
    turnout_percentage: float
    voting_status: str = "active"  # active, closed
    message: str = "Results are being updated in real-time"
