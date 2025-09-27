#!/usr/bin/env python3
"""
🔐 Secure Configuration Management for Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import secrets
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("database.env")

class Config:
    """Base configuration class with security best practices"""
    
    # 🔐 Security Configuration
    SECRET_KEY = os.getenv('SECRET_KEY') or secrets.token_hex(32)
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours in seconds
    
    # 🗄️ Database Configuration
    MYSQL_HOST = os.getenv('MYSQL_HOST')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
    MYSQL_DB = os.getenv('MYSQL_DB')
    
    # 📧 Mail Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
    
    # 📱 SMS Configuration
    FAST2SMS_API_KEY = os.getenv('FAST2SMS_API_KEY')
    
    # 🚀 Performance Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # 🔍 Validation Configuration
    MAX_NAME_LENGTH = 50
    MAX_EMAIL_LENGTH = 100
    MAX_PHONE_LENGTH = 15
    MAX_MESSAGE_LENGTH = 1000
    
    @staticmethod
    def validate_config() -> bool:
        """Validate that all required configuration is present"""
        required_vars = [
            'MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DB',
            'MAIL_SERVER', 'MAIL_USERNAME', 'MAIL_PASSWORD'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(Config, var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"❌ Missing required configuration: {', '.join(missing_vars)}")
            return False
        
        print("✅ Configuration validation passed")
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True  # Require HTTPS in production

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    SESSION_COOKIE_SECURE = False

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}