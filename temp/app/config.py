"""
Application Configuration
Environment variables and settings
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    APP_NAME: str = "VoteOn API"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/voteon_dev"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - will be parsed from comma-separated string in .env
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # File Upload
    MAX_FILE_SIZE: int = 5 * 1024 * 1024
    UPLOAD_DIR: str = "uploads"
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".docx", ".jpg", ".jpeg", ".png"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    def __init__(self, **kwargs):
        # Parse CORS_ORIGINS if it's a string
        if 'CORS_ORIGINS' in kwargs and isinstance(kwargs['CORS_ORIGINS'], str):
            kwargs['CORS_ORIGINS'] = [origin.strip() for origin in kwargs['CORS_ORIGINS'].split(',')]
        super().__init__(**kwargs)


settings = Settings()
