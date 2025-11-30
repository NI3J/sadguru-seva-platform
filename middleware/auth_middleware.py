from functools import wraps
from flask import session, redirect, url_for, jsonify, request

def login_required(f):
    """
    Decorator to require authentication for routes.
    Redirects to auth page if not authenticated.
    Returns JSON error for API routes.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is authenticated
        if not session.get('authenticated') or not session.get('user_id'):
            # For API routes, return JSON error
            if request.path.startswith('/api/'):
                return jsonify({
                    'success': False,
                    'error': 'Authentication required',
                    'redirect': '/auth'
                }), 401
            
            # For regular routes, redirect to auth page
            return redirect(url_for('auth.auth_page'))
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user_id():
    """
    Get the current authenticated user's ID.
    Returns None if not authenticated.
    """
    if session.get('authenticated') and session.get('user_id'):
        return session.get('user_id')
    return None

def get_current_user_info():
    """
    Get the current authenticated user's information.
    Returns dict with user info or None if not authenticated.
    """
    if session.get('authenticated') and session.get('user_id'):
        return {
            'id': session.get('user_id'),
            'name': session.get('user_name'),
            'mobile': session.get('user_mobile')
        }
    return None

def is_authenticated():
    """
    Check if user is currently authenticated.
    """
    return bool(session.get('authenticated') and session.get('user_id'))
