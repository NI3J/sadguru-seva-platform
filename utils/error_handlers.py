#!/usr/bin/env python3
"""
🚨 Error Handling System for Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

from flask import render_template, request, jsonify, current_app
from utils.logger import logger
from utils.validators import ValidationError
import traceback

class ErrorHandler:
    """Centralized error handling system"""
    
    @staticmethod
    def register_error_handlers(app):
        """Register all error handlers with Flask app"""
        
        @app.errorhandler(400)
        def bad_request(error):
            """Handle bad request errors"""
            logger.log_error(error, {
                'error_type': 'bad_request',
                'endpoint': request.endpoint,
                'method': request.method,
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Bad Request',
                    'message': 'The request was invalid or cannot be served.',
                    'status_code': 400
                }), 400
            
            return render_template('errors/400.html'), 400
        
        @app.errorhandler(401)
        def unauthorized(error):
            """Handle unauthorized access"""
            logger.log_security_event('unauthorized_access', {
                'endpoint': request.endpoint,
                'ip': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'Authentication required.',
                    'status_code': 401
                }), 401
            
            return render_template('errors/401.html'), 401
        
        @app.errorhandler(403)
        def forbidden(error):
            """Handle forbidden access"""
            logger.log_security_event('forbidden_access', {
                'endpoint': request.endpoint,
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Forbidden',
                    'message': 'You do not have permission to access this resource.',
                    'status_code': 403
                }), 403
            
            return render_template('errors/403.html'), 403
        
        @app.errorhandler(404)
        def not_found(error):
            """Handle page not found"""
            logger.log_error(error, {
                'error_type': 'not_found',
                'endpoint': request.endpoint,
                'path': request.path,
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Not Found',
                    'message': 'The requested resource was not found.',
                    'status_code': 404
                }), 404
            
            return render_template('errors/404.html'), 404
        
        @app.errorhandler(429)
        def too_many_requests(error):
            """Handle rate limiting"""
            logger.log_security_event('rate_limit_exceeded', {
                'endpoint': request.endpoint,
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Too Many Requests',
                    'message': 'Rate limit exceeded. Please try again later.',
                    'status_code': 429
                }), 429
            
            return render_template('errors/429.html'), 429
        
        @app.errorhandler(500)
        def internal_error(error):
            """Handle internal server errors"""
            logger.log_error(error, {
                'error_type': 'internal_server_error',
                'endpoint': request.endpoint,
                'traceback': traceback.format_exc(),
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Internal Server Error',
                    'message': 'An unexpected error occurred. Please try again later.',
                    'status_code': 500
                }), 500
            
            return render_template('errors/500.html'), 500
        
        @app.errorhandler(ValidationError)
        def validation_error(error):
            """Handle validation errors"""
            logger.log_security_event('validation_error', {
                'error': str(error),
                'endpoint': request.endpoint,
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Validation Error',
                    'message': str(error),
                    'status_code': 400
                }), 400
            
            return render_template('errors/validation.html', error=str(error)), 400
        
        @app.errorhandler(Exception)
        def handle_unexpected_error(error):
            """Handle unexpected errors"""
            logger.log_error(error, {
                'error_type': 'unexpected_error',
                'endpoint': request.endpoint,
                'traceback': traceback.format_exc(),
                'ip': request.remote_addr
            })
            
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Unexpected Error',
                    'message': 'An unexpected error occurred. Please try again later.',
                    'status_code': 500
                }), 500
            
            return render_template('errors/500.html'), 500

def create_error_templates():
    """Create error template files"""
    error_templates = {
        'errors/400.html': '''
<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bad Request - Sadguru Seva Platform</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="error-container">
        <h1>400 - Bad Request</h1>
        <p>आपला अनुरोध अवैध आहे किंवा सेवा दिली जाऊ शकत नाही.</p>
        <a href="/" class="btn btn-primary">मुख्य पृष्ठावर जा</a>
    </div>
</body>
</html>
        ''',
        
        'errors/401.html': '''
<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unauthorized - Sadguru Seva Platform</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="error-container">
        <h1>401 - Unauthorized</h1>
        <p>या संसाधनास प्रवेश करण्यासाठी प्रमाणीकरण आवश्यक आहे.</p>
        <a href="/auth" class="btn btn-primary">लॉगिन करा</a>
    </div>
</body>
</html>
        ''',
        
        'errors/404.html': '''
<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Sadguru Seva Platform</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="error-container">
        <h1>404 - Page Not Found</h1>
        <p>आपण शोधत असलेले पृष्ठ सापडले नाही.</p>
        <a href="/" class="btn btn-primary">मुख्य पृष्ठावर जा</a>
    </div>
</body>
</html>
        ''',
        
        'errors/500.html': '''
<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Sadguru Seva Platform</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="error-container">
        <h1>500 - Internal Server Error</h1>
        <p>सर्व्हरमध्ये अप्रत्याशित त्रुटी आली आहे. कृपया नंतर पुन्हा प्रयत्न करा.</p>
        <a href="/" class="btn btn-primary">मुख्य पृष्ठावर जा</a>
    </div>
</body>
</html>
        '''
    }
    
    return error_templates