#!/usr/bin/env python3
"""
🔐 Security Utilities for Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import secrets
import hashlib
import hmac
import time
from typing import Optional, Dict, Any
from flask import session, request, current_app
from utils.logger import logger

class SecurityManager:
    """Comprehensive security management"""
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate secure OTP"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(length)])
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """Hash password with salt using PBKDF2"""
        if salt is None:
            salt = secrets.token_hex(16)
        
        # Use PBKDF2 with SHA-256
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # 100,000 iterations
        )
        
        return password_hash.hex(), salt
    
    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        """Verify password against stored hash"""
        password_hash, _ = SecurityManager.hash_password(password, salt)
        return hmac.compare_digest(password_hash, stored_hash)
    
    @staticmethod
    def create_secure_session(user_data: Dict[str, Any]) -> str:
        """Create secure session with proper validation"""
        session_id = SecurityManager.generate_secure_token()
        
        # Set session data
        session['session_id'] = session_id
        session['user_data'] = user_data
        session['created_at'] = time.time()
        session['last_activity'] = time.time()
        session['ip_address'] = request.remote_addr
        session['user_agent'] = request.headers.get('User-Agent', '')
        
        # Log session creation
        logger.log_user_activity(
            user_id=user_data.get('id', 'unknown'),
            activity='session_created',
            details={'session_id': session_id, 'ip': request.remote_addr}
        )
        
        return session_id
    
    @staticmethod
    def validate_session() -> bool:
        """Validate current session"""
        if not session.get('session_id'):
            return False
        
        # Check session age (24 hours)
        created_at = session.get('created_at', 0)
        if time.time() - created_at > 86400:  # 24 hours
            SecurityManager.destroy_session()
            return False
        
        # Check last activity (1 hour)
        last_activity = session.get('last_activity', 0)
        if time.time() - last_activity > 3600:  # 1 hour
            SecurityManager.destroy_session()
            return False
        
        # Update last activity
        session['last_activity'] = time.time()
        
        return True
    
    @staticmethod
    def destroy_session():
        """Safely destroy session"""
        session_id = session.get('session_id')
        user_id = session.get('user_data', {}).get('id', 'unknown')
        
        # Log session destruction
        logger.log_user_activity(
            user_id=user_id,
            activity='session_destroyed',
            details={'session_id': session_id}
        )
        
        session.clear()
    
    @staticmethod
    def get_current_user() -> Optional[Dict[str, Any]]:
        """Get current authenticated user"""
        if not SecurityManager.validate_session():
            return None
        
        return session.get('user_data')
    
    @staticmethod
    def require_authentication(f):
        """Decorator to require authentication"""
        from functools import wraps
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not SecurityManager.validate_session():
                logger.log_security_event(
                    'unauthorized_access_attempt',
                    {'endpoint': request.endpoint, 'ip': request.remote_addr}
                )
                return {'error': 'Authentication required'}, 401
            
            return f(*args, **kwargs)
        
        return decorated_function

class RateLimiter:
    """Simple rate limiting implementation"""
    
    def __init__(self):
        self.attempts = {}
    
    def is_allowed(self, identifier: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """Check if request is within rate limit"""
        current_time = time.time()
        window_start = current_time - (window_minutes * 60)
        
        # Clean old attempts
        if identifier in self.attempts:
            self.attempts[identifier] = [
                attempt_time for attempt_time in self.attempts[identifier]
                if attempt_time > window_start
            ]
        else:
            self.attempts[identifier] = []
        
        # Check if under limit
        if len(self.attempts[identifier]) < max_attempts:
            self.attempts[identifier].append(current_time)
            return True
        
        return False
    
    def get_remaining_attempts(self, identifier: str, max_attempts: int = 5, window_minutes: int = 15) -> int:
        """Get remaining attempts for identifier"""
        current_time = time.time()
        window_start = current_time - (window_minutes * 60)
        
        if identifier not in self.attempts:
            return max_attempts
        
        recent_attempts = [
            attempt_time for attempt_time in self.attempts[identifier]
            if attempt_time > window_start
        ]
        
        return max(0, max_attempts - len(recent_attempts))

# Global instances
security_manager = SecurityManager()
rate_limiter = RateLimiter()

def require_rate_limit(max_attempts: int = 5, window_minutes: int = 15):
    """Decorator for rate limiting"""
    from functools import wraps
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            identifier = request.remote_addr
            
            if not rate_limiter.is_allowed(identifier, max_attempts, window_minutes):
                logger.log_security_event(
                    'rate_limit_exceeded',
                    {'ip': identifier, 'endpoint': request.endpoint}
                )
                return {'error': 'Rate limit exceeded'}, 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator