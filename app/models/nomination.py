"""
Nomination Model
Represents candidate nomination applications
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class NominationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Nomination(Base):
    __tablename__ = "nominations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Nomination details
    position = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    manifesto = Column(Text, nullable=True)
    
    # Documents
    documents = Column(Text, nullable=True)  # JSON array of file URLs
    
    # Endorsers
    endorsers = Column(Text, nullable=True)  # JSON array of user IDs
    
    # Status
    status = Column(Enum(NominationStatus), default=NominationStatus.PENDING, nullable=False)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Nomination {self.id} by User {self.user_id} - {self.status.value}>"
