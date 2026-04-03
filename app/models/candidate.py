"""
Candidate Model
Represents approved candidates in elections
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Candidate information
    name = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    manifesto = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    
    # Approval status
    approved = Column(Boolean, default=False, nullable=False)
    
    # Vote count (denormalized for performance)
    vote_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    votes = relationship("Vote", back_populates="candidate")
    
    def __repr__(self):
        return f"<Candidate {self.name} - {self.position}>"
