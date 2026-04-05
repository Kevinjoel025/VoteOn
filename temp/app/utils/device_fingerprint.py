"""
Device Fingerprinting Utility
Generates device ID from browser fingerprint data
"""

import hashlib


def generate_device_id(user_agent: str, screen_resolution: str, language: str, timezone: str) -> str:
    """
    Generate a device fingerprint hash from browser data
    
    Args:
        user_agent: Browser user agent string
        screen_resolution: Screen resolution (e.g., "1920x1080")
        language: Browser language (e.g., "en-US")
        timezone: Browser timezone (e.g., "America/New_York")
        
    Returns:
        SHA256 hash as device identifier
    """
    # Combine all fingerprint data
    fingerprint_data = f"{user_agent}{screen_resolution}{language}{timezone}"
    
    # Generate SHA256 hash
    device_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    return device_hash


def parse_device_info_from_headers(headers: dict) -> dict:
    """
    Extract device fingerprint data from HTTP headers
    
    Args:
        headers: HTTP request headers
        
    Returns:
        Dictionary with device fingerprint components
    """
    return {
        "user_agent": headers.get("user-agent", ""),
        "screen_resolution": headers.get("x-screen-resolution", ""),
        "language": headers.get("accept-language", "").split(",")[0] if headers.get("accept-language") else "",
        "timezone": headers.get("x-timezone", "")
    }
