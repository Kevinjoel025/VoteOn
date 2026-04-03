"""
Vote Model
Represents votes cast by users with fraud detection data
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    
    # Vote receipt
    receipt_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Fraud detection
    device_id = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    risk_score = Column(Float, default=0.0, nullable=False)
    is_suspicious = Column(Boolean, default=False, nullable=False)
    
    # Vote validity
    is_valid = Column(Boolean, default=True, nullable=False)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    candidate = relationship("Candidate", back_populates="votes")
    
    def __repr__(self):
        return f"<Vote {self.receipt_id} by User {self.user_id}>"
