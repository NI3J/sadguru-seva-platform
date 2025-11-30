#!/usr/bin/env python3
"""
🔍 Input Validation & Sanitization Utilities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import re
import html
from typing import Optional, Dict, Any, List
from config import Config

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

class InputValidator:
    """Comprehensive input validation and sanitization"""
    
    # Regex patterns for validation
    PATTERNS = {
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'phone': re.compile(r'^[6-9]\d{9}$'),  # Indian mobile numbers
        'name': re.compile(r'^[A-Za-z\s\u0900-\u097F]{2,50}$'),  # English + Devanagari
        'alphanumeric': re.compile(r'^[A-Za-z0-9\s\u0900-\u097F]+$'),
        'safe_string': re.compile(r'^[A-Za-z0-9\s\u0900-\u097F.,!?()-]+$')
    }
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = None) -> str:
        """Sanitize string input by escaping HTML and trimming"""
        if not isinstance(value, str):
            raise ValidationError("Input must be a string")
        
        # Trim whitespace
        sanitized = value.strip()
        
        # Escape HTML entities
        sanitized = html.escape(sanitized)
        
        # Check length
        if max_length and len(sanitized) > max_length:
            raise ValidationError(f"String too long. Maximum {max_length} characters allowed.")
        
        return sanitized
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate and sanitize email address"""
        if not email:
            raise ValidationError("Email is required")
        
        email = email.strip().lower()
        
        if not InputValidator.PATTERNS['email'].match(email):
            raise ValidationError("Invalid email format")
        
        if len(email) > Config.MAX_EMAIL_LENGTH:
            raise ValidationError(f"Email too long. Maximum {Config.MAX_EMAIL_LENGTH} characters.")
        
        return email
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate and normalize Indian mobile number"""
        if not phone:
            raise ValidationError("Phone number is required")
        
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Remove country code if present
        if digits.startswith('91') and len(digits) == 12:
            digits = digits[2:]
        elif digits.startswith('+91'):
            digits = digits[3:]
        
        # Validate Indian mobile number format
        if not InputValidator.PATTERNS['phone'].match(digits):
            raise ValidationError("Invalid Indian mobile number format")
        
        return digits
    
    @staticmethod
    def validate_name(name: str) -> str:
        """Validate and sanitize name"""
        if not name:
            raise ValidationError("Name is required")
        
        sanitized = InputValidator.sanitize_string(name, Config.MAX_NAME_LENGTH)
        
        if not InputValidator.PATTERNS['name'].match(sanitized):
            raise ValidationError("Name contains invalid characters")
        
        return sanitized
    
    @staticmethod
    def validate_message(message: str) -> str:
        """Validate and sanitize message content"""
        if not message:
            raise ValidationError("Message is required")
        
        sanitized = InputValidator.sanitize_string(message, Config.MAX_MESSAGE_LENGTH)
        
        if not InputValidator.PATTERNS['safe_string'].match(sanitized):
            raise ValidationError("Message contains invalid characters")
        
        return sanitized
    
    @staticmethod
    def validate_seva_interest(seva: str) -> str:
        """Validate seva interest selection"""
        if not seva:
            raise ValidationError("Seva interest is required")
        
        # Allowed seva types
        allowed_sevas = [
            'भक्तिगीत', 'कथा श्रवण', 'सत्संग', 'जप साधना',
            'सेवा कार्य', 'शिक्षण', 'अन्य'
        ]
        
        if seva not in allowed_sevas:
            raise ValidationError("Invalid seva interest selected")
        
        return seva
    
    @staticmethod
    def validate_city(city: str) -> str:
        """Validate city name"""
        if not city:
            raise ValidationError("City is required")
        
        sanitized = InputValidator.sanitize_string(city, 50)
        
        if not InputValidator.PATTERNS['alphanumeric'].match(sanitized):
            raise ValidationError("City name contains invalid characters")
        
        return sanitized

class FormValidator:
    """Form-specific validation"""
    
    @staticmethod
    def validate_bhaktgan_form(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate bhaktgan registration form"""
        validated_data = {}
        
        try:
            validated_data['name'] = InputValidator.validate_name(data.get('name', ''))
            validated_data['email'] = InputValidator.validate_email(data.get('email', ''))
            validated_data['phone'] = InputValidator.validate_phone(data.get('phone', ''))
            validated_data['city'] = InputValidator.validate_city(data.get('city', ''))
            validated_data['seva_interest'] = InputValidator.validate_seva_interest(data.get('seva_interest', ''))
            
        except ValidationError as e:
            raise ValidationError(f"Form validation failed: {str(e)}")
        
        return validated_data
    
    @staticmethod
    def validate_contact_form(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate contact form"""
        validated_data = {}
        
        try:
            validated_data['name'] = InputValidator.validate_name(data.get('name', ''))
            validated_data['email'] = InputValidator.validate_email(data.get('email', ''))
            validated_data['phone'] = InputValidator.validate_phone(data.get('phone', ''))
            validated_data['message'] = InputValidator.validate_message(data.get('message', ''))
            
        except ValidationError as e:
            raise ValidationError(f"Contact form validation failed: {str(e)}")
        
        return validated_data
    
    @staticmethod
    def validate_auth_form(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate authentication form"""
        validated_data = {}
        
        try:
            validated_data['name'] = InputValidator.validate_name(data.get('name', ''))
            validated_data['mobile'] = InputValidator.validate_phone(data.get('mobile', ''))
            
        except ValidationError as e:
            raise ValidationError(f"Authentication validation failed: {str(e)}")
        
        return validated_data

def validate_input(input_type: str, value: str) -> str:
    """Convenience function for input validation"""
    validators = {
        'email': InputValidator.validate_email,
        'phone': InputValidator.validate_phone,
        'name': InputValidator.validate_name,
        'message': InputValidator.validate_message,
        'city': InputValidator.validate_city,
        'seva': InputValidator.validate_seva_interest
    }
    
    if input_type not in validators:
        raise ValidationError(f"Unknown input type: {input_type}")
    
    return validators[input_type](value)