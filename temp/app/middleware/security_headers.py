"""
Security Headers Middleware
Adds security headers to protect against common attacks
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if settings.ENABLE_SECURITY_HEADERS:
            # Prevent clickjacking attacks
            response.headers["X-Frame-Options"] = "DENY"
            
            # Prevent MIME type sniffing
            response.headers["X-Content-Type-Options"] = "nosniff"
            
            # XSS Protection
            response.headers["X-XSS-Protection"] = "1; mode=block"
            
            # Referrer Policy
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Content Security Policy (CSP)
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https://images.unsplash.com https:",
                "connect-src 'self' https://api.github.com",
                "frame-ancestors 'none'",
                "form-action 'self'"
            ]
            response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
            
            # Strict Transport Security (HTTPS only in production)
            if settings.ENVIRONMENT == "production":
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            # Permissions Policy (limit browser features)
            permissions_policy = [
                "geolocation=()",
                "microphone=()",
                "camera=()",
                "magnetometer=()",
                "gyroscope=()",
                "speaker=()",
                "fullscreen=(self)",
                "payment=()"
            ]
            response.headers["Permissions-Policy"] = ", ".join(permissions_policy)
        
        return response