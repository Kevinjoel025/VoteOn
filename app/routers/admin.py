"""
Admin Router
Admin-only endpoints for managing the voting system
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Nomination, NominationStatus, Vote, Candidate, ActivityLog
from app.schemas.admin import (
    AdminNominationResponse, NominationActionRequest,
    SuspiciousVoteResponse, VoteActionRequest,
    AdminUserResponse, UserActionRequest,
    AdminDashboardResponse, AdminAnalyticsResponse
)
from app.middleware.auth import get_current_admin
from datetime import datetime
from typing import List
import json

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin dashboard with key statistics
    
    - Requires admin role
    - Returns overview of system status
    """
    # Get statistics
    total_users = db.query(User).count()
    total_votes = db.query(Vote).filter(Vote.is_valid == True).count()
    suspicious_votes = db.query(Vote).filter(Vote.is_suspicious == True).count()
    pending_nominations = db.query(Nomination).filter(Nomination.status == NominationStatus.PENDING).count()
    active_candidates = db.query(Candidate).filter(Candidate.approved == True).count()
    
    turnout = (total_votes / total_users * 100) if total_users > 0 else 0
    
    # Get recent activity (last 10 activities)
    recent_activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    recent_activity = [
        {
            "action": activity.action,
            "details": activity.details,
            "timestamp": activity.timestamp.isoformat() if activity.timestamp else None
        }
        for activity in recent_activities
    ]
    
    return {
        "total_users": total_users,
        "total_votes": total_votes,
        "suspicious_votes": suspicious_votes,
        "pending_nominations": pending_nominations,
        "active_candidates": active_candidates,
        "turnout_percentage": round(turnout, 2),
        "recent_activity": recent_activity
    }


@router.get("/nominations/pending", response_model=List[AdminNominationResponse])
async def get_pending_nominations(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all pending nominations for review
    
    - Requires admin role
    - Returns detailed nomination information
    """
    nominations = db.query(Nomination).filter(
        Nomination.status == NominationStatus.PENDING
    ).all()
    
    result = []
    for nom in nominations:
        user = db.query(User).filter(User.id == nom.user_id).first()
        
        result.append({
            "id": nom.id,
            "user_id": nom.user_id,
            "username": user.username if user else "Unknown",
            "email": user.email if user else "Unknown",
            "position": nom.position,
            "bio": nom.bio,
            "manifesto": nom.manifesto,
            "documents": json.loads(nom.documents) if nom.documents else [],
            "endorsers": json.loads(nom.endorsers) if nom.endorsers else [],
            "status": nom.status.value,
            "admin_notes": nom.admin_notes,
            "created_at": nom.created_at.isoformat() if nom.created_at else None
        })
    
    return result


@router.post("/nominations/{nomination_id}/action")
async def handle_nomination_action(
    nomination_id: int,
    action_request: NominationActionRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a nomination
    
    - Requires admin role
    - Creates candidate if approved
    """
    nomination = db.query(Nomination).filter(Nomination.id == nomination_id).first()
    
    if not nomination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nomination not found"
        )
    
    if action_request.action == "approve":
        # Create candidate
        new_candidate = Candidate(
            user_id=nomination.user_id,
            name=db.query(User).filter(User.id == nomination.user_id).first().username,
            position=nomination.position,
            bio=nomination.bio,
            manifesto=nomination.manifesto,
            approved=True,
            vote_count=0
        )
        db.add(new_candidate)
        
        # Update nomination status
        nomination.status = NominationStatus.APPROVED
        nomination.admin_notes = action_request.admin_notes
        nomination.reviewed_at = datetime.utcnow()
        
        message = f"Nomination approved and candidate created"
        
    elif action_request.action == "reject":
        nomination.status = NominationStatus.REJECTED
        nomination.admin_notes = action_request.admin_notes or "Nomination rejected by admin"
        nomination.reviewed_at = datetime.utcnow()
        
        message = "Nomination rejected"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'approve' or 'reject'"
        )
    
    # Log activity
    activity = ActivityLog(
        user_id=admin.id,
        action=f"nomination_{action_request.action}",
        details=f"Admin {admin.username} {action_request.action}ed nomination {nomination_id}",
        ip_address="admin_panel"
    )
    db.add(activity)
    
    db.commit()
    
    return {
        "message": message,
        "nomination_id": nomination_id,
        "new_status": nomination.status.value
    }


@router.get("/votes/suspicious", response_model=List[SuspiciousVoteResponse])
async def get_suspicious_votes(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all suspicious votes for review
    
    - Requires admin role
    - Returns votes with high risk scores
    """
    suspicious_votes = db.query(Vote).filter(
        Vote.is_suspicious == True
    ).order_by(Vote.risk_score.desc()).all()
    
    result = []
    for vote in suspicious_votes:
        user = db.query(User).filter(User.id == vote.user_id).first()
        candidate = db.query(Candidate).filter(Candidate.id == vote.candidate_id).first()
        
        result.append({
            "id": vote.id,
            "receipt_id": vote.receipt_id,
            "user_id": vote.user_id,
            "username": user.username if user else "Unknown",
            "candidate_id": vote.candidate_id,
            "candidate_name": candidate.name if candidate else "Unknown",
            "risk_score": vote.risk_score,
            "is_suspicious": vote.is_suspicious,
            "device_id": vote.device_id,
            "ip_address": vote.ip_address,
            "timestamp": vote.timestamp.isoformat() if vote.timestamp else None,
            "is_valid": vote.is_valid
        })
    
    return result


@router.post("/votes/{vote_id}/action")
async def handle_vote_action(
    vote_id: int,
    action_request: VoteActionRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Invalidate or clear flag on a vote
    
    - Requires admin role
    - Updates vote validity and candidate counts
    """
    vote = db.query(Vote).filter(Vote.id == vote_id).first()
    
    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
    
    candidate = db.query(Candidate).filter(Candidate.id == vote.candidate_id).first()
    
    if action_request.action == "invalidate":
        if vote.is_valid:
            vote.is_valid = False
            # Decrement candidate vote count
            if candidate and candidate.vote_count > 0:
                candidate.vote_count -= 1
            message = "Vote invalidated"
        else:
            message = "Vote was already invalid"
            
    elif action_request.action == "clear_flag":
        vote.is_suspicious = False
        message = "Suspicious flag cleared"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'invalidate' or 'clear_flag'"
        )
    
    # Log activity
    activity = ActivityLog(
        user_id=admin.id,
        action=f"vote_{action_request.action}",
        details=f"Admin {admin.username} performed {action_request.action} on vote {vote_id}",
        ip_address="admin_panel"
    )
    db.add(activity)
    
    db.commit()
    
    return {
        "message": message,
        "vote_id": vote_id,
        "is_valid": vote.is_valid,
        "is_suspicious": vote.is_suspicious
    }


@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    limit: int = 100
):
    """
    Get all users for management
    
    - Requires admin role
    - Paginated results
    """
    users = db.query(User).limit(limit).all()
    
    result = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "has_voted": user.has_voted,
            "is_active": user.is_active,
            "device_id": user.device_id,
            "ip_address": user.ip_address,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        for user in users
    ]
    
    return result


@router.post("/users/{user_id}/action")
async def handle_user_action(
    user_id: int,
    action_request: UserActionRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Block, unblock, or delete a user
    
    - Requires admin role
    - Cannot target other admins
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from targeting other admins
    if target_user.role.value == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot perform actions on admin users"
        )
    
    if action_request.action == "block":
        target_user.is_active = False
        message = f"User {target_user.username} blocked"
        
    elif action_request.action == "unblock":
        target_user.is_active = True
        message = f"User {target_user.username} unblocked"
        
    elif action_request.action == "delete":
        # Soft delete - just deactivate
        target_user.is_active = False
        target_user.email = f"deleted_{target_user.id}@deleted.com"
        message = f"User {target_user.username} deleted"
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'block', 'unblock', or 'delete'"
        )
    
    # Log activity
    activity = ActivityLog(
        user_id=admin.id,
        action=f"user_{action_request.action}",
        details=f"Admin {admin.username} {action_request.action}ed user {target_user.username}",
        ip_address="admin_panel"
    )
    db.add(activity)
    
    db.commit()
    
    return {
        "message": message,
        "user_id": user_id,
        "is_active": target_user.is_active
    }