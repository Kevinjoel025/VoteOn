"""
Fraud Detection Service
Analyzes voting patterns and calculates risk scores
"""

from sqlalchemy.orm import Session
from app.models import Vote, User
from datetime import datetime, timedelta
from typing import Tuple


class FraudDetectionService:
    """Service for detecting fraudulent voting patterns"""
    
    @staticmethod
    def calculate_risk_score(
        user: User,
        device_id: str,
        ip_address: str,
        db: Session
    ) -> Tuple[float, bool]:
        """
        Calculate fraud risk score for a vote
        
        Args:
            user: User casting the vote
            device_id: Device fingerprint
            ip_address: User's IP address
            db: Database session
            
        Returns:
            Tuple of (risk_score, is_suspicious)
            
        Risk Scoring:
            - Same device, different users: +3
            - Same IP, multiple votes: +2
            - Account age < 1 hour: +2
            - Rapid voting pattern (< 5 min): +3
            
        Classification:
            - 0-2: Normal
            - 3-5: Suspicious
            - 6+: Highly Suspicious
        """
        risk_score = 0.0
        
        # Check 1: Same device used by multiple users
        if device_id:
            device_votes = db.query(Vote).filter(
                Vote.device_id == device_id,
                Vote.user_id != user.id
            ).count()
            
            if device_votes > 0:
                risk_score += 3
                print(f"⚠️  Device {device_id[:8]}... used by {device_votes} other users (+3 risk)")
        
        # Check 2: Same IP address with multiple votes
        if ip_address:
            ip_votes = db.query(Vote).filter(
                Vote.ip_address == ip_address
            ).count()
            
            if ip_votes > 0:
                risk_score += 2
                print(f"⚠️  IP {ip_address} has {ip_votes} votes (+2 risk)")
        
        # Check 3: New account (created < 1 hour ago)
        if user.created_at:
            account_age = datetime.utcnow() - user.created_at.replace(tzinfo=None)
            if account_age < timedelta(hours=1):
                risk_score += 2
                print(f"⚠️  Account created {account_age.seconds//60} minutes ago (+2 risk)")
        
        # Check 4: Rapid voting pattern (multiple votes from same IP in < 5 minutes)
        if ip_address:
            recent_cutoff = datetime.utcnow() - timedelta(minutes=5)
            recent_votes = db.query(Vote).filter(
                Vote.ip_address == ip_address,
                Vote.timestamp >= recent_cutoff
            ).count()
            
            if recent_votes > 0:
                risk_score += 3
                print(f"⚠️  {recent_votes} votes from IP in last 5 minutes (+3 risk)")
        
        # Determine if suspicious
        is_suspicious = risk_score >= 3
        
        if is_suspicious:
            print(f"🚨 SUSPICIOUS VOTE DETECTED - Risk Score: {risk_score}")
        else:
            print(f"✅ Vote appears normal - Risk Score: {risk_score}")
        
        return risk_score, is_suspicious
