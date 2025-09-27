#!/usr/bin/env python3
"""
📊 Advanced Logging System for Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import logging
import logging.handlers
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps

class StructuredLogger:
    """Enhanced logging with structured JSON output and rotation"""
    
    def __init__(self, name: str = 'sadguru_seva', log_level: str = 'INFO'):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.upper()))
        
        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup file and console handlers with rotation"""
        
        # Create logs directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)
        
        # File handler with rotation (10MB max, keep 5 files)
        file_handler = logging.handlers.RotatingFileHandler(
            'logs/sadguru_seva.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        
        # Console handler
        console_handler = logging.StreamHandler()
        
        # JSON formatter for structured logging
        json_formatter = JsonFormatter()
        file_handler.setFormatter(json_formatter)
        
        # Simple formatter for console
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def log_user_activity(self, user_id: str, activity: str, details: Dict[str, Any] = None):
        """Log user activities with structured data"""
        log_data = {
            'event_type': 'user_activity',
            'user_id': user_id,
            'activity': activity,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
    
    def log_security_event(self, event_type: str, details: Dict[str, Any] = None):
        """Log security-related events"""
        log_data = {
            'event_type': 'security',
            'security_event': event_type,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        self.logger.warning(json.dumps(log_data, ensure_ascii=False))
    
    def log_performance(self, operation: str, duration_ms: float, details: Dict[str, Any] = None):
        """Log performance metrics"""
        log_data = {
            'event_type': 'performance',
            'operation': operation,
            'duration_ms': duration_ms,
            'details': details or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log errors with full context"""
        log_data = {
            'event_type': 'error',
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        self.logger.error(json.dumps(log_data, ensure_ascii=False))

class JsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, ensure_ascii=False)

# Global logger instance
logger = StructuredLogger()

def log_function_call(func):
    """Decorator to log function calls with performance metrics"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = datetime.utcnow()
        function_name = f"{func.__module__}.{func.__name__}"
        
        try:
            result = func(*args, **kwargs)
            duration = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            logger.log_performance(
                operation=function_name,
                duration_ms=duration,
                details={'status': 'success'}
            )
            return result
            
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            logger.log_error(
                error=e,
                context={
                    'function': function_name,
                    'duration_ms': duration,
                    'args_count': len(args),
                    'kwargs_keys': list(kwargs.keys())
                }
            )
            raise
    
    return wrapper

def log_user_action(user_id: str, action: str):
    """Decorator to log user actions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger.log_user_activity(
                user_id=user_id,
                activity=action,
                details={'function': func.__name__}
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator