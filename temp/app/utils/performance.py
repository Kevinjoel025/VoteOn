"""
Performance Optimization Utilities
Database query optimization and caching helpers
"""

from functools import wraps
from typing import Any, Callable, Optional
import hashlib
import json
import time
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Simple in-memory cache (for development - use Redis in production)
_cache = {}
_cache_timestamps = {}

def cache_response(ttl: int = 300):
    """
    Decorator to cache function responses
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = _create_cache_key(func.__name__, args, kwargs)
            
            # Check if cached result exists and is still valid
            if cache_key in _cache:
                cached_time = _cache_timestamps.get(cache_key, 0)
                if time.time() - cached_time < ttl:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return _cache[cache_key]
                else:
                    # Remove expired cache entry
                    del _cache[cache_key]
                    del _cache_timestamps[cache_key]
            
            # Execute function and cache result
            logger.debug(f"Cache miss for {func.__name__}")
            result = await func(*args, **kwargs)
            
            # Cache the result
            _cache[cache_key] = result
            _cache_timestamps[cache_key] = time.time()
            
            return result
        return wrapper
    return decorator


def _create_cache_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Create a cache key from function name and arguments"""
    # Convert arguments to string for hashing
    key_data = {
        'function': func_name,
        'args': str(args),
        'kwargs': sorted(kwargs.items()) if kwargs else []
    }
    
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()


def clear_cache(pattern: Optional[str] = None):
    """Clear cache entries, optionally matching a pattern"""
    global _cache, _cache_timestamps
    
    if pattern is None:
        # Clear all cache
        _cache.clear()
        _cache_timestamps.clear()
        logger.info("Cleared all cache entries")
    else:
        # Clear entries matching pattern
        keys_to_remove = [key for key in _cache.keys() if pattern in key]
        for key in keys_to_remove:
            del _cache[key]
            del _cache_timestamps[key]
        logger.info(f"Cleared {len(keys_to_remove)} cache entries matching '{pattern}'")


class QueryOptimizer:
    """Database query optimization helpers"""
    
    @staticmethod
    def get_optimized_candidates_query(db_session):
        """
        Optimized query for candidates with vote counts
        Uses single query with joins instead of N+1 queries
        """
        from sqlalchemy import func
        from app.models import Candidate, Vote
        
        return db_session.query(
            Candidate,
            func.coalesce(func.count(Vote.id), 0).label('vote_count')
        ).outerjoin(Vote).group_by(Candidate.id)
    
    @staticmethod
    def get_vote_statistics_query(db_session):
        """
        Optimized query for vote statistics
        Single query to get all needed vote metrics
        """
        from sqlalchemy import func, case
        from app.models import Vote, User
        
        return db_session.query(
            func.count(Vote.id).label('total_votes'),
            func.count(case([(Vote.is_suspicious == True, 1)])).label('suspicious_votes'),
            func.count(case([(Vote.is_valid == False, 1)])).label('invalid_votes'),
            func.count(User.id).label('total_users')
        ).outerjoin(User, Vote.user_id == User.id)
    
    @staticmethod 
    def batch_update_vote_counts(db_session):
        """
        Batch update candidate vote counts
        More efficient than updating one by one
        """
        from sqlalchemy import text
        
        # Update all candidate vote counts in single query
        query = text("""
            UPDATE candidates 
            SET vote_count = (
                SELECT COUNT(*) 
                FROM votes 
                WHERE votes.candidate_id = candidates.id 
                AND votes.is_valid = true
            )
        """)
        
        result = db_session.execute(query)
        db_session.commit()
        return result.rowcount


# Performance monitoring decorator
def monitor_performance(func: Callable) -> Callable:
    """
    Decorator to monitor function execution time
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log slow queries (> 1 second)
            if execution_time > 1.0:
                logger.warning(f"Slow execution: {func.__name__} took {execution_time:.2f}s")
            else:
                logger.debug(f"Execution time: {func.__name__} took {execution_time:.3f}s")
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error in {func.__name__} after {execution_time:.3f}s: {str(e)}")
            raise
    
    return wrapper