"""
Google OAuth Service
Handles Google OAuth 2.0 authentication flow
"""

from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config import settings
from app.models import User, UserRole
from app.utils.security import create_access_token, create_refresh_token
from typing import Dict, Any

# Initialize OAuth
oauth = OAuth()

if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )


class GoogleOAuthService:
    """Service for handling Google OAuth authentication"""
    
    @staticmethod
    def get_authorization_url(request: Request) -> str:
        """
        Generate Google OAuth authorization URL
        
        Args:
            request: FastAPI request object
            
        Returns:
            Authorization URL for redirect
        """
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth is not configured"
            )
        
        google = oauth.create_client('google')
        redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        return google.authorize_redirect(request, redirect_uri)
    
    @staticmethod
    async def handle_callback(request: Request, db: Session) -> Dict[str, Any]:
        """
        Handle Google OAuth callback and create/login user
        
        Args:
            request: FastAPI request with authorization code
            db: Database session
            
        Returns:
            Token response with user data
        """
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth is not configured"
            )
        
        try:
            google = oauth.create_client('google')
            token = await google.authorize_access_token(request)
            
            # Get user info from Google
            user_info = token.get('userinfo')
            if not user_info:
                user_info = await google.parse_id_token(request, token)
            
            google_id = user_info.get('sub')
            email = user_info.get('email')
            name = user_info.get('name', '')
            picture = user_info.get('picture', '')
            
            if not google_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information from Google"
                )
            
            # Check if user exists by Google ID
            user = db.query(User).filter(User.google_id == google_id).first()
            
            if not user:
                # Check if user exists by email
                user = db.query(User).filter(User.email == email).first()
                
                if user:
                    # Link Google account to existing user
                    user.google_id = google_id
                    user.profile_picture = picture
                else:
                    # Create new user
                    # Generate username from name or email
                    username = name.replace(' ', '').lower() if name else email.split('@')[0]
                    
                    # Ensure username is unique
                    base_username = username
                    counter = 1
                    while db.query(User).filter(User.username == username).first():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    user = User(
                        username=username,
                        email=email,
                        password_hash="",  # No password for OAuth users
                        role=UserRole.VOTER,
                        google_id=google_id,
                        profile_picture=picture,
                        is_active=True,
                        has_voted=False
                    )
                    db.add(user)
            
            db.commit()
            db.refresh(user)
            
            # Generate tokens
            access_token = create_access_token(data={"sub": str(user.id)})
            refresh_token = create_refresh_token(data={"sub": str(user.id)})
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role.value,
                    "has_voted": user.has_voted,
                    "profile_picture": user.profile_picture
                }
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth authentication failed: {str(e)}"
            )