"""
Logging Configuration
Centralized logging setup for the application
"""

import logging
import logging.handlers
import sys
from datetime import datetime
from pathlib import Path
from app.config import settings


class CustomFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels"""
    
    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green  
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record):
        # Add color for console output
        if hasattr(record, 'levelname'):
            color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
            record.levelname = f"{color}{record.levelname}{self.COLORS['RESET']}"
        
        return super().format(record)


def setup_logging():
    """Configure application logging"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = CustomFormatter(
        fmt=settings.LOG_FORMAT,
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    
    # File handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        filename=log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_formatter = logging.Formatter(
        fmt=settings.LOG_FORMAT,
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        filename=log_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=3
    )
    error_handler.setFormatter(file_formatter)
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)
    
    # Security events handler
    security_handler = logging.handlers.RotatingFileHandler(
        filename=log_dir / "security.log",
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5
    )
    security_formatter = logging.Formatter(
        fmt='%(asctime)s - SECURITY - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    security_handler.setFormatter(security_formatter)
    
    # Create security logger
    security_logger = logging.getLogger('security')
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.INFO)
    security_logger.propagate = False  # Don't send to root logger
    
    # Reduce noise from libraries
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    logging.info("Logging configuration completed")


def get_logger(name: str = None) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)


def log_security_event(event: str, details: dict = None, user_id: int = None, ip: str = None):
    """Log security-related events"""
    security_logger = logging.getLogger('security')
    
    log_data = {
        'event': event,
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'ip_address': ip,
        'details': details or {}
    }
    
    security_logger.info(f"Security Event: {log_data}")