#!/usr/bin/env python3
"""
🌸 Enhanced Virtuous Photos System for Sadguru Seva Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import os
import json
import logging
from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, current_app, session, redirect, url_for
from werkzeug.utils import secure_filename
from db_config import get_db_cursor
from utils.validators import InputValidator, ValidationError
from utils.logger import logger, log_function_call
from utils.security import security_manager
from utils.security import SecurityManager
from config import Config

photos_bp = Blueprint('photos', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
app_logger = logging.getLogger(__name__)

# Allowed file extensions for uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
UPLOAD_FOLDER = 'static/images/virtuous_photos'

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_directory():
    """Ensure upload directory exists"""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_photo_categories():
    """Get available photo categories"""
    return [
        {'id': 'darshan', 'name': 'दर्शन', 'description': 'सद्गुरूंचे पावन दर्शन'},
        {'id': 'satsang', 'name': 'सत्संग', 'description': 'सत्संग कार्यक्रम'},
        {'id': 'festivals', 'name': 'सण', 'description': 'धार्मिक सण आणि उत्सव'},
        {'id': 'ashram', 'name': 'आश्रम', 'description': 'आश्रमाचे दृश्य'},
        {'id': 'devotees', 'name': 'भक्तगण', 'description': 'भक्तगणांचे कार्यक्रम'},
        {'id': 'nature', 'name': 'निसर्ग', 'description': 'आध्यात्मिक निसर्ग दृश्य'}
    ]

def get_fallback_photos():
    """Enhanced fallback photos with better data"""
    return [
        {
            'id': 1,
            'image_path': '/static/images/virtue1.jpg',
            'title': 'सद्गुरूंचे पहिले दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा आणि शांतीचा अनुभव',
            'alt_text': 'सद्गुरूंचे दर्शन 1',
            'category': 'darshan',
            'tags': ['दर्शन', 'आध्यात्म', 'शांती'],
            'upload_date': '2024-01-01',
            'is_active': True
        },
        {
            'id': 2,
            'image_path': '/static/images/virtue2.jpg',
            'title': 'सद्गुरूंचे दुसरे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - भक्ती आणि प्रेमाचा अनुभव',
            'alt_text': 'सद्गुरूंचे दर्शन 2',
            'category': 'darshan',
            'tags': ['दर्शन', 'भक्ती', 'प्रेम'],
            'upload_date': '2024-01-02',
            'is_active': True
        },
        {
            'id': 3,
            'image_path': '/static/images/virtue3.jpg',
            'title': 'सद्गुरूंचे तिसरे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - ज्ञान आणि प्रकाशाचा अनुभव',
            'alt_text': 'सद्गुरूंचे दर्शन 3',
            'category': 'darshan',
            'tags': ['दर्शन', 'ज्ञान', 'प्रकाश'],
            'upload_date': '2024-01-03',
            'is_active': True
        },
        {
            'id': 4,
            'image_path': '/static/images/virtue4.jpg',
            'title': 'सद्गुरूंचे चौथे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - करुणा आणि दया',
            'alt_text': 'सद्गुरूंचे दर्शन 4',
            'category': 'darshan',
            'tags': ['दर्शन', 'करुणा', 'दया'],
            'upload_date': '2024-01-04',
            'is_active': True
        },
        {
            'id': 5,
            'image_path': '/static/images/virtue5.jpg',
            'title': 'सद्गुरूंचे पाचवे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आनंद आणि उत्साह',
            'alt_text': 'सद्गुरूंचे दर्शन 5',
            'category': 'darshan',
            'tags': ['दर्शन', 'आनंद', 'उत्साह'],
            'upload_date': '2024-01-05',
            'is_active': True
        },
        {
            'id': 6,
            'image_path': '/static/images/virtue6.jpg',
            'title': 'सद्गुरूंचे सहावे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - शक्ती आणि ऊर्जा',
            'alt_text': 'सद्गुरूंचे दर्शन 6',
            'category': 'darshan',
            'tags': ['दर्शन', 'शक्ती', 'ऊर्जा'],
            'upload_date': '2024-01-06',
            'is_active': True
        }
    ]

@log_function_call
def safe_db_operation(operation_func, fallback_data=None):
    """Enhanced database operation with comprehensive error handling"""
    try:
        with get_db_cursor() as cursor:
            result = operation_func(cursor)
            return result
    except Exception as e:
        logger.log_error(e, {'operation': 'database_operation'})
        return fallback_data if fallback_data is not None else []

# ============================================================================
# MAIN ROUTES
# ============================================================================

@photos_bp.route('/virtuous-photos')
@log_function_call
def virtuous_photos():
    """Enhanced virtuous photos page with categories and search"""
    try:
        logger.log_user_activity('anonymous', 'virtuous_photos_page_visit')
        
        # Get categories for filter
        categories = get_photo_categories()
        
        return render_template('virtuous_photos_enhanced.html', 
                             categories=categories)
    except Exception as e:
        logger.log_error(e, {'operation': 'virtuous_photos_page'})
        return render_template('errors/500.html'), 500

@photos_bp.route('/virtuous-photos/admin')
@SecurityManager.require_authentication
@log_function_call
def photos_admin():
    """Admin interface for photo management"""
    try:
        user = security_manager.get_current_user()
        logger.log_user_activity(user['id'], 'photos_admin_access')
        
        categories = get_photo_categories()
        return render_template('photos_admin.html', categories=categories)
    except Exception as e:
        logger.log_error(e, {'operation': 'photos_admin'})
        return redirect(url_for('photos.virtuous_photos'))

# ============================================================================
# API ROUTES - PHOTO MANAGEMENT
# ============================================================================

@photos_bp.route('/api/photos')
@log_function_call
def get_photos():
    """Enhanced photo retrieval with filtering and pagination"""
    try:
        # Get query parameters
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))
        
        def db_operation(cursor):
            # Build dynamic query
            where_conditions = ["is_active = TRUE"]
            params = []
            
            if category:
                where_conditions.append("category = %s")
                params.append(category)
            
            if search:
                where_conditions.append("(title LIKE %s OR description LIKE %s OR tags LIKE %s)")
                search_term = f"%{search}%"
                params.extend([search_term, search_term, search_term])
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count
            count_query = f"SELECT COUNT(*) as total FROM virtuous_photos WHERE {where_clause}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']
            
            # Get photos with pagination
            offset = (page - 1) * per_page
            photos_query = f"""
                SELECT id, image_path, title, description, alt_text, category, 
                       tags, upload_date, view_count, is_active
                FROM virtuous_photos 
                WHERE {where_clause}
                ORDER BY upload_date DESC, id DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(photos_query, params + [per_page, offset])
            photos = cursor.fetchall()
            
            return {
                'photos': photos,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        
        result = safe_db_operation(db_operation, {
            'photos': get_fallback_photos(),
            'total': len(get_fallback_photos()),
            'page': 1,
            'per_page': per_page,
            'total_pages': 1
        })
        
        logger.log_user_activity('anonymous', 'photos_api_call', {
            'category': category,
            'search': search,
            'page': page,
            'count': len(result['photos'])
        })
        
        return jsonify({
            'success': True,
            'data': result,
            'categories': get_photo_categories()
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'get_photos_api'})
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve photos',
            'data': {
                'photos': get_fallback_photos(),
                'total': len(get_fallback_photos()),
                'page': 1,
                'per_page': 12,
                'total_pages': 1
            }
        })

@photos_bp.route('/api/photos/<int:photo_id>')
@log_function_call
def get_photo_detail(photo_id):
    """Get detailed information about a specific photo"""
    try:
        def db_operation(cursor):
            cursor.execute("""
                SELECT id, image_path, title, description, alt_text, category,
                       tags, upload_date, view_count, is_active
                FROM virtuous_photos 
                WHERE id = %s AND is_active = TRUE
            """, (photo_id,))
            photo = cursor.fetchone()
            
            if photo:
                # Increment view count
                cursor.execute("""
                    UPDATE virtuous_photos 
                    SET view_count = view_count + 1 
                    WHERE id = %s
                """, (photo_id,))
                cursor.connection.commit()
            
            return photo
        
        photo = safe_db_operation(db_operation)
        
        if not photo:
            return jsonify({
                'success': False,
                'error': 'Photo not found'
            }), 404
        
        logger.log_user_activity('anonymous', 'photo_detail_view', {
            'photo_id': photo_id,
            'title': photo['title']
        })
        
        return jsonify({
            'success': True,
            'photo': photo
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'get_photo_detail'})
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve photo details'
        }), 500

@photos_bp.route('/api/photos/random')
@log_function_call
def get_random_photo():
    """Get a random photo from the collection"""
    try:
        def db_operation(cursor):
            cursor.execute("""
                SELECT id, image_path, title, description, alt_text, category
                FROM virtuous_photos
                WHERE is_active = TRUE
                ORDER BY RAND()
                LIMIT 1
            """)
            return cursor.fetchone()
        
        photo = safe_db_operation(db_operation)
        
        if not photo:
            # Return random fallback photo
            import random
            fallback_photos = get_fallback_photos()
            photo = random.choice(fallback_photos)
        
        return jsonify({
            'success': True,
            'photo': photo
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'get_random_photo'})
        return jsonify({
            'success': False,
            'error': 'Failed to get random photo'
        }), 500

# ============================================================================
# ADMIN API ROUTES
# ============================================================================

@photos_bp.route('/api/photos/upload', methods=['POST'])
@SecurityManager.require_authentication
@log_function_call
def upload_photo():
    """Upload a new photo (admin only)"""
    try:
        user = security_manager.get_current_user()
        
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP'
            }), 400
        
        # Validate form data
        try:
            title = InputValidator.validate_name(request.form.get('title', ''))
            description = InputValidator.validate_message(request.form.get('description', ''))
            category = request.form.get('category', 'darshan')
            tags = request.form.get('tags', '')
        except ValidationError as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
        
        # Ensure upload directory exists
        ensure_upload_directory()
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Save file
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Save to database
        def db_operation(cursor):
            cursor.execute("""
                INSERT INTO virtuous_photos 
                (image_path, title, description, alt_text, category, tags, upload_date, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), TRUE)
            """, (
                f"/static/images/virtuous_photos/{filename}",
                title,
                description,
                title,  # Use title as alt_text
                category,
                tags
            ))
            cursor.connection.commit()
            return cursor.lastrowid
        
        photo_id = safe_db_operation(db_operation)
        
        logger.log_user_activity(user['id'], 'photo_uploaded', {
            'photo_id': photo_id,
            'filename': filename,
            'title': title
        })
        
        return jsonify({
            'success': True,
            'message': 'Photo uploaded successfully',
            'photo_id': photo_id,
            'image_path': f"/static/images/virtuous_photos/{filename}"
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'upload_photo'})
        return jsonify({
            'success': False,
            'error': 'Failed to upload photo'
        }), 500

@photos_bp.route('/api/photos/<int:photo_id>', methods=['PUT'])
@SecurityManager.require_authentication
@log_function_call
def update_photo(photo_id):
    """Update photo information (admin only)"""
    try:
        user = security_manager.get_current_user()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate data
        try:
            title = InputValidator.validate_name(data.get('title', ''))
            description = InputValidator.validate_message(data.get('description', ''))
            category = data.get('category', 'darshan')
            tags = data.get('tags', '')
            is_active = bool(data.get('is_active', True))
        except ValidationError as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
        
        def db_operation(cursor):
            cursor.execute("""
                UPDATE virtuous_photos 
                SET title = %s, description = %s, category = %s, 
                    tags = %s, is_active = %s, updated_at = NOW()
                WHERE id = %s
            """, (title, description, category, tags, is_active, photo_id))
            cursor.connection.commit()
            return cursor.rowcount
        
        affected_rows = safe_db_operation(db_operation)
        
        if affected_rows == 0:
            return jsonify({
                'success': False,
                'error': 'Photo not found'
            }), 404
        
        logger.log_user_activity(user['id'], 'photo_updated', {
            'photo_id': photo_id,
            'title': title
        })
        
        return jsonify({
            'success': True,
            'message': 'Photo updated successfully'
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'update_photo'})
        return jsonify({
            'success': False,
            'error': 'Failed to update photo'
        }), 500

@photos_bp.route('/api/photos/<int:photo_id>', methods=['DELETE'])
@SecurityManager.require_authentication
@log_function_call
def delete_photo(photo_id):
    """Delete a photo (admin only)"""
    try:
        user = security_manager.get_current_user()
        
        def db_operation(cursor):
            cursor.execute("DELETE FROM virtuous_photos WHERE id = %s", (photo_id,))
            cursor.connection.commit()
            return cursor.rowcount
        
        affected_rows = safe_db_operation(db_operation)
        
        if affected_rows == 0:
            return jsonify({
                'success': False,
                'error': 'Photo not found'
            }), 404
        
        logger.log_user_activity(user['id'], 'photo_deleted', {
            'photo_id': photo_id
        })
        
        return jsonify({
            'success': True,
            'message': 'Photo deleted successfully'
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'delete_photo'})
        return jsonify({
            'success': False,
            'error': 'Failed to delete photo'
        }), 500

# ============================================================================
# UTILITY ROUTES
# ============================================================================

@photos_bp.route('/api/photos/categories')
@log_function_call
def get_categories():
    """Get available photo categories"""
    return jsonify({
        'success': True,
        'categories': get_photo_categories()
    })

@photos_bp.route('/api/photos/stats')
@log_function_call
def get_photo_stats():
    """Get photo statistics"""
    try:
        def db_operation(cursor):
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_photos,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_photos,
                    COUNT(CASE WHEN category = 'darshan' THEN 1 END) as darshan_photos,
                    SUM(view_count) as total_views,
                    AVG(view_count) as avg_views
                FROM virtuous_photos
            """)
            return cursor.fetchone()
        
        stats = safe_db_operation(db_operation, {
            'total_photos': 0,
            'active_photos': 0,
            'darshan_photos': 0,
            'total_views': 0,
            'avg_views': 0
        })
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.log_error(e, {'operation': 'get_photo_stats'})
        return jsonify({
            'success': False,
            'error': 'Failed to get statistics'
        }), 500

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@photos_bp.errorhandler(404)
def handle_404(e):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@photos_bp.errorhandler(500)
def handle_500(e):
    """Handle 500 errors"""
    logger.log_error(e, {'operation': 'photos_error_handler'})
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500