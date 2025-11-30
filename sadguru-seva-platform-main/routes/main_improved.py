#!/usr/bin/env python3
"""
🌟 Improved Main Routes with Enhanced Security & Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import pymysql
from flask import Blueprint, render_template, request, current_app, jsonify, session
from db_config import get_db_cursor
from routes.utils import send_email
from routes.storage import save_bhakt_to_csv
from utils.validators import FormValidator, ValidationError
from utils.logger import logger, log_function_call
from utils.security import security_manager, require_rate_limit
from config import Config

# 🌟 Create Blueprint
main_bp = Blueprint('main', __name__)

@log_function_call
def get_daily_programs():
    """Get daily programs with error handling"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM daily_programs ORDER BY date DESC LIMIT 10")
            programs = cursor.fetchall()
            return programs
    except Exception as e:
        logger.log_error(e, {'operation': 'get_daily_programs'})
        return []

# 🌼 Home Page
@main_bp.route('/')
@log_function_call
def home():
    """Enhanced home page with error handling"""
    try:
        logger.log_user_activity('anonymous', 'home_page_visit')
        return render_template('index.html')
    except Exception as e:
        logger.log_error(e, {'operation': 'home_page'})
        return render_template('index.html'), 500

# 📖 About Page
@main_bp.route('/about')
@log_function_call
def about():
    """Enhanced about page with program data"""
    try:
        programs = get_daily_programs()
        logger.log_user_activity('anonymous', 'about_page_visit')
        return render_template('about.html', programs=programs)
    except Exception as e:
        logger.log_error(e, {'operation': 'about_page'})
        return render_template('about.html', programs=[]), 500

# 🙏 Bhaktgan Registration - Enhanced
@main_bp.route('/bhaktgan/', methods=['GET', 'POST'])
@require_rate_limit(max_attempts=3, window_minutes=15)
@log_function_call
def bhaktgan():
    """Enhanced bhaktgan registration with validation"""
    logger.log_user_activity('anonymous', 'bhaktgan_page_access')
    
    if request.method == 'POST':
        try:
            # Validate form data
            validated_data = FormValidator.validate_bhaktgan_form(request.form)
            
            # Check for existing registration
            with get_db_cursor() as cursor:
                cursor.execute("SELECT COUNT(*) as count FROM bhaktgan WHERE email=%s", (validated_data['email'],))
                result = cursor.fetchone()
                already_registered = result['count'] > 0
                
                if already_registered:
                    logger.log_user_activity('anonymous', 'duplicate_registration_attempt', {
                        'email': validated_data['email']
                    })
                    return render_template('bhaktgan.html', 
                                         message="🌸 You're already part of the Bhaktgan.",
                                         bhaktgan=[])
                
                # Insert new bhakt
                cursor.execute("""
                    INSERT INTO bhaktgan (name, email, phone, seva_interest, city, submitted_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (
                    validated_data['name'],
                    validated_data['email'], 
                    validated_data['phone'],
                    validated_data['seva_interest'],
                    validated_data['city']
                ))
                cursor.connection.commit()
                
                bhakt_id = cursor.lastrowid
                
                # Log successful registration
                logger.log_user_activity('anonymous', 'bhaktgan_registration_success', {
                    'bhakt_id': bhakt_id,
                    'email': validated_data['email'],
                    'city': validated_data['city']
                })
                
                # Save to CSV (non-blocking)
                try:
                    save_bhakt_to_csv(
                        validated_data['name'],
                        validated_data['email'],
                        validated_data['phone'],
                        validated_data['seva_interest'],
                        validated_data['city']
                    )
                except Exception as e:
                    logger.log_error(e, {'operation': 'csv_backup'})
                
                # Send welcome email (non-blocking)
                try:
                    welcome_html = render_template('bhaktgan_welcome.html', 
                                                 name=validated_data['name'], 
                                                 seva=validated_data['seva_interest'])
                    send_email(
                        subject="🌸 Welcome to Bhaktgan",
                        recipients=validated_data['email'],
                        html_body=welcome_html
                    )
                except Exception as e:
                    logger.log_error(e, {'operation': 'welcome_email'})
                
                message = "🕉️ तुमच्या सेवेची माहिती सुरक्षितरित्या भरली गेली आहे 🙏 सेवा दिल्याबद्दल धन्यवाद!"
                
        except ValidationError as e:
            logger.log_security_event('validation_error', {'error': str(e)})
            return render_template('bhaktgan.html', 
                                 message=f"❌ {str(e)}",
                                 bhaktgan=[])
        except Exception as e:
            logger.log_error(e, {'operation': 'bhaktgan_registration'})
            return render_template('bhaktgan.html', 
                                 message="❌ Registration failed. Please try again.",
                                 bhaktgan=[]), 500
    
    # Get existing bhakts for display
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT name, email, phone, seva_interest, city, submitted_at 
                FROM bhaktgan 
                ORDER BY id DESC 
                LIMIT 50
            """)
            bhakts = cursor.fetchall()
    except Exception as e:
        logger.log_error(e, {'operation': 'get_bhakts_list'})
        bhakts = []
    
    return render_template('bhaktgan.html', message=None, bhaktgan=bhakts)

# 📬 Contact Page - Enhanced
@main_bp.route('/contact', methods=['GET', 'POST'])
@require_rate_limit(max_attempts=5, window_minutes=30)
@log_function_call
def contact():
    """Enhanced contact page with validation"""
    if request.method == 'POST':
        try:
            # Validate form data
            validated_data = FormValidator.validate_contact_form(request.form)
            
            # Log contact form submission
            logger.log_user_activity('anonymous', 'contact_form_submission', {
                'email': validated_data['email'],
                'name': validated_data['name']
            })
            
            # Send auto-reply email
            try:
                reply_html = render_template('contact_autoreply.html', 
                                           name=validated_data['name'], 
                                           message=validated_data['message'])
                send_email(
                    subject="आपला संदेश प्राप्त झाला आहे 🙏",
                    recipients=validated_data['email'],
                    html_body=reply_html
                )
            except Exception as e:
                logger.log_error(e, {'operation': 'contact_autoreply'})
            
            return render_template('contact.html', success=True)
            
        except ValidationError as e:
            logger.log_security_event('contact_validation_error', {'error': str(e)})
            return render_template('contact.html', 
                                 error=f"❌ {str(e)}")
        except Exception as e:
            logger.log_error(e, {'operation': 'contact_form'})
            return render_template('contact.html', 
                                 error="❌ Message sending failed. Please try again."), 500
    
    return render_template('contact.html')

# 📄 Fast2SMS Verification File
@main_bp.route('/fast2sms_verify.txt')
@log_function_call
def fast2sms_file():
    """Serve Fast2SMS verification file"""
    try:
        return current_app.send_static_file('fast2sms_verify.txt')
    except Exception as e:
        logger.log_error(e, {'operation': 'fast2sms_file'})
        return "File not found", 404

# 🔍 Health Check Endpoint
@main_bp.route('/health')
@log_function_call
def health_check():
    """Application health check"""
    try:
        # Test database connection
        with get_db_cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': logger.logger.info('Health check passed'),
            'version': '1.0.0'
        }), 200
    except Exception as e:
        logger.log_error(e, {'operation': 'health_check'})
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500