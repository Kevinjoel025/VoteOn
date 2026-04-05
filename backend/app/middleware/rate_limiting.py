"""
Rate Limiting Middleware
Prevents abuse and protects against brute force attacks
"""

import time
from typing import Dict, Tuple
from collections import defaultdict, deque
from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.config import settings


class RateLimiter:
    """In-memory rate limiter using sliding window"""
    
    def __init__(self):
        # Dictionary to store request timestamps for each IP
        self.requests: Dict[str, deque] = defaultdict(deque)
        
    def is_allowed(self, identifier: str, limit: int, window: int = 60) -> Tuple[bool, float]:
        """
        Check if request is allowed based on rate limit
        
        Args:
            identifier: IP address or user identifier
            limit: Maximum requests allowed
            window: Time window in seconds (default: 60)
            
        Returns:
            Tuple of (is_allowed, retry_after_seconds)
        """
        now = time.time()
        requests = self.requests[identifier]
        
        # Remove old requests outside the window
        while requests and requests[0] <= now - window:
            requests.popleft()
            
        # Check if limit exceeded
        if len(requests) >= limit:
            # Calculate retry after time
            retry_after = requests[0] + window - now
            return False, retry_after
            
        # Add current request
        requests.append(now)
        return True, 0.0


# Global rate limiter instance
rate_limiter = RateLimiter()


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware for applying rate limits to different endpoints"""
    
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Apply rate limiting based on endpoint
        if await self.should_rate_limit(request):
            limit, window = self.get_rate_limit_config(request)
            
            is_allowed, retry_after = rate_limiter.is_allowed(
                identifier=client_ip,
                limit=limit,
                window=window
            )
            
            if not is_allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "message": "Rate limit exceeded",
                        "retry_after": int(retry_after) + 1
                    },
                    headers={"Retry-After": str(int(retry_after) + 1)}
                )
        
        # Process request
        response = await call_next(request)
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded IP (from proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
            
        # Check for real IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        # Fall back to client host
        return request.client.host if request.client else "unknown"
    
    async def should_rate_limit(self, request: Request) -> bool:
        """Determine if request should be rate limited"""
        path = request.url.path
        
        # Always rate limit authentication endpoints
        auth_endpoints = ["/api/auth/login", "/api/auth/register"]
        if any(path.startswith(endpoint) for endpoint in auth_endpoints):
            return True
            
        # Rate limit voting endpoint
        if path.startswith("/api/vote"):
            return True
            
        # Rate limit admin endpoints (additional protection)
        if path.startswith("/api/admin"):
            return True
            
        return False
    
    def get_rate_limit_config(self, request: Request) -> Tuple[int, int]:
        """Get rate limit configuration for specific endpoint"""
        path = request.url.path
        
        # Stricter limits for authentication
        if path.startswith("/api/auth/login"):
            return settings.RATE_LIMIT_LOGIN, 60  # 5 requests per minute
            
        if path.startswith("/api/auth/register"):
            return settings.RATE_LIMIT_LOGIN, 60  # 5 requests per minute
            
        # Voting endpoint - prevent rapid voting
        if path.startswith("/api/vote"):
            return 3, 60  # 3 attempts per minute
            
        # General API limits
        return settings.RATE_LIMIT_GENERAL, 60  # 100 requests per minute