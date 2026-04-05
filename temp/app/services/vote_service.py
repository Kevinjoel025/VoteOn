"""
Vote Service
Business logic for voting operations
"""

from sqlalchemy.orm import Session
from app.models import User, Candidate, Vote
from app.services.fraud_detection import FraudDetectionService
from app.utils.device_fingerprint import generate_device_id
from fastapi import HTTPException, status
import random
import string
from datetime import datetime


class VoteService:
    """Service for handling vote operations"""
    
    @staticmethod
    def generate_receipt_id() -> str:
        """Generate unique vote receipt ID"""
        year = datetime.now().year
        random_digits = ''.join(random.choices(string.digits, k=5))
        return f"VT-{year}-{random_digits}"
    
    @staticmethod
    def generate_blockchain_hash() -> str:
        """Generate simulated blockchain hash"""
        # Simulated blockchain hash for demo purposes
        random_hex = ''.join(random.choices('0123456789abcdef', k=64))
        return f"0x{random_hex}"
    
    @staticmethod
    def cast_vote(
        user: User,
        candidate_id: int,
        device_info: dict,
        ip_address: str,
        db: Session
    ) -> dict:
        """
        Cast a vote with fraud detection
        
        Args:
            user: Authenticated user
            candidate_id: ID of candidate to vote for
            device_info: Device fingerprint data
            ip_address: User's IP address
            db: Database session
            
        Returns:
            Vote confirmation data
            
        Raises:
            HTTPException: If vote is invalid
        """
        # Check if user already voted
        if user.has_voted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already voted in this election"
            )
        
        # Check if candidate exists and is approved
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )
        
        if not candidate.approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not approved for voting"
            )
        
        # Generate device ID from fingerprint
        device_id = None
        if device_info:
            device_id = generate_device_id(
                device_info.get("userAgent", ""),
                device_info.get("screenResolution", ""),
                device_info.get("language", ""),
                device_info.get("timezone", "")
            )
        
        # Run fraud detection
        fraud_service = FraudDetectionService()
        risk_score, is_suspicious = fraud_service.calculate_risk_score(
            user, device_id, ip_address, db
        )
        
        # Create vote record
        receipt_id = VoteService.generate_receipt_id()
        new_vote = Vote(
            user_id=user.id,
            candidate_id=candidate_id,
            receipt_id=receipt_id,
            device_id=device_id,
            ip_address=ip_address,
            risk_score=risk_score,
            is_suspicious=is_suspicious,
            is_valid=True
        )
        
        db.add(new_vote)
        
        # Update user voting status
        user.has_voted = True
        user.device_id = device_id
        user.ip_address = ip_address
        
        # Update candidate vote count
        candidate.vote_count += 1
        
        # Commit transaction
        db.commit()
        db.refresh(new_vote)
        
        print(f"✅ Vote cast successfully - Receipt: {receipt_id}")
        
        return {
            "message": "Vote cast successfully!",
            "receipt_id": receipt_id,
            "candidate_name": candidate.name,
            "timestamp": new_vote.timestamp.isoformat(),
            "blockchain_hash": VoteService.generate_blockchain_hash()
        }
