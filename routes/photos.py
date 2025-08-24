from flask import Blueprint, render_template, jsonify, request, current_app
from db_config import get_db_connection
import logging
from datetime import datetime

photos_bp = Blueprint('photos', __name__)

# ----------------------------
# HELPER FUNCTIONS
# ----------------------------
def rows_to_dicts(cursor, rows):
    """Convert DB rows to list of dicts regardless of cursor type."""
    if not rows:
        return []
    first = rows[0]
    if isinstance(first, dict):
        return rows  # Already dicts
    col_names = [desc[0] for desc in cursor.description]
    return [dict(zip(col_names, row)) for row in rows]

def get_fallback_photos(source="default", error_msg=None):
    """Return fallback photos when database fails or is empty."""
    fallback_data = []
    
    # Create fallback photos using your actual static images
    static_photos = [
        {
            'id': 1,
            'image_path': '/static/images/virtue1.jpg',
            'title': 'सद्गुरूंचे पहिले दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 1'
        },
        {
            'id': 2,
            'image_path': '/static/images/virtue2.jpg',
            'title': 'सद्गुरूंचे दुसरे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 2'
        },
        {
            'id': 3,
            'image_path': '/static/images/virtue3.jpg',
            'title': 'सद्गुरूंचे तिसरे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 3'
        },
        {
            'id': 4,
            'image_path': '/static/images/virtue4.jpg',
            'title': 'सद्गुरूंचे चौथे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 4'
        },
        {
            'id': 5,
            'image_path': '/static/images/virtue5.jpg',
            'title': 'सद्गुरूंचे पाचवे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 5'
        },
        {
            'id': 6,
            'image_path': '/static/images/virtue6.jpg',
            'title': 'सद्गुरूंचे सहावे दर्शन',
            'description': 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा',
            'alt_text': 'सद्गुरूंचे दर्शन 6'
        }
    ]
    
    if source == "error" and error_msg:
        return [{
            'id': 1,
            'image_path': 'https://via.placeholder.com/800x500/ff6b6b/ffffff?text=डेटाबेस+एरर',
            'title': 'डेटाबेस त्रुटी',
            'description': f'त्रुटी: {error_msg}',
            'alt_text': 'डेटाबेस त्रुटी'
        }]
    
    return static_photos

def safe_db_operation(operation_func, fallback_source="error"):
    """Safely execute database operations with proper error handling."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        result = operation_func(connection, cursor)
        return result
    except Exception as e:
        current_app.logger.error(f"Database operation failed: {e}")
        if fallback_source == "error":
            return get_fallback_photos("error", str(e))
        return get_fallback_photos("default")
    finally:
        if cursor: 
            cursor.close()
        if connection: 
            connection.close()

# ----------------------------
# PAGE ROUTES
# ----------------------------
@photos_bp.route('/virtuous-photos')
def virtuous_photos():
    """Display the virtuous photos page."""
    try:
        current_app.logger.info("Loading virtuous photos page")
        return render_template('virtuous_photos.html')
    except Exception as e:
        current_app.logger.error(f"Error loading virtuous photos page: {str(e)}")
        return f"Error loading page: {str(e)}", 500

# ----------------------------
# API ROUTES - MAIN FUNCTIONALITY
# ----------------------------
@photos_bp.route('/api/photos')
def get_photos():
    """Get all active photos from database with fallback to static images."""
    current_app.logger.info("API: Getting photos")
    
    def db_operation(connection, cursor):
        query = """
        SELECT id, image_path, title, description, alt_text
        FROM virtuous_photos
        WHERE is_active = TRUE
        ORDER BY id ASC
        """
        cursor.execute(query)
        photos = rows_to_dicts(cursor, cursor.fetchall())
        current_app.logger.info(f"Found {len(photos)} active photos from database")
        
        if not photos:
            current_app.logger.info("No photos in database, using static fallback")
            return get_fallback_photos("default")
        
        return photos
    
    photos = safe_db_operation(db_operation, "default")
    
    return jsonify({
        'success': True,
        'photos': photos,
        'count': len(photos),
        'source': 'database' if photos and photos[0].get('id', 0) <= 1000 else 'fallback'
    })

@photos_bp.route('/api/photos/random')
def get_random_photo():
    """Get a random photo from the collection."""
    current_app.logger.info("API: Getting random photo")
    
    def db_operation(connection, cursor):
        cursor.execute("""
            SELECT id, image_path, title, description, alt_text
            FROM virtuous_photos
            WHERE is_active = TRUE
            ORDER BY RAND()
            LIMIT 1
        """)
        rows = rows_to_dicts(cursor, cursor.fetchall())
        return rows[0] if rows else None
    
    photo = safe_db_operation(db_operation, "default")
    
    if not photo or isinstance(photo, list):
        # If no photo from DB, get random from fallback
        fallback_photos = get_fallback_photos("default")
        import random
        photo = random.choice(fallback_photos) if fallback_photos else fallback_photos[0]
    
    return jsonify({
        'success': True,
        'photo': photo
    })

# ----------------------------
# API ROUTES - ADMIN/MANAGEMENT
# ----------------------------
@photos_bp.route('/api/photos/add', methods=['POST'])
def add_photo():
    """Add a new photo to the database."""
    try:
        data = request.json
        if not data or not data.get('image_path'):
            return jsonify({
                'success': False, 
                'error': 'Image path is required'
            }), 400

        def db_operation(connection, cursor):
            cursor.execute("""
                INSERT INTO virtuous_photos (image_path, title, description, alt_text)
                VALUES (%s, %s, %s, %s)
            """, (
                data['image_path'],
                data.get('title', ''),
                data.get('description', ''),
                data.get('alt_text', '')
            ))
            connection.commit()
            return cursor.lastrowid
        
        photo_id = safe_db_operation(db_operation)
        
        return jsonify({
            'success': True, 
            'message': 'Photo added successfully', 
            'photo_id': photo_id
        })
        
    except Exception as e:
        current_app.logger.error(f"Error in add_photo: {e}")
        return jsonify({
            'success': False, 
            'error': 'Server error'
        }), 500

# ----------------------------
# API ROUTES - UTILITY/DEBUG
# ----------------------------
@photos_bp.route('/api/photos/status')
def api_status():
    """Check API status."""
    return jsonify({
        'success': True,
        'status': 'API is working!',
        'message': 'Photos API is responding',
        'timestamp': str(datetime.now())
    })

@photos_bp.route('/api/photos/test')
def test_connection():
    """Test database connection."""
    def db_operation(connection, cursor):
        cursor.execute("SELECT 1 as test")
        return cursor.fetchone()
    
    try:
        result = safe_db_operation(db_operation)
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'test_result': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Database connection failed'
        }), 500

@photos_bp.route('/api/photos/debug')
def debug_info():
    """Get debug information about the API."""
    try:
        import db_config
        db_config_status = "OK"
    except Exception as e:
        db_config_status = f"FAILED: {str(e)}"

    try:
        import mysql.connector
        mysql_status = "OK"
    except Exception as e:
        mysql_status = f"FAILED: {str(e)}"

    return jsonify({
        'success': True,
        'debug_info': {
            'db_config_import': db_config_status,
            'mysql_connector': mysql_status,
            'current_app_logger': hasattr(current_app, 'logger'),
            'blueprint_name': photos_bp.name,
            'route_url': request.url,
            'static_images_available': [
                '/static/images/virtue1.jpg',
                '/static/images/virtue2.jpg',
                '/static/images/virtue3.jpg',
                '/static/images/virtue4.jpg',
                '/static/images/virtue5.jpg',
                '/static/images/virtue6.jpg'
            ]
        }
    })

# ----------------------------
# ERROR HANDLERS
# ----------------------------
@photos_bp.errorhandler(404)
def handle_404(e):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Route not found'
    }), 404

@photos_bp.errorhandler(500)
def handle_500(e):
    """Handle 500 errors."""
    current_app.logger.error(f"Internal server error: {e}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
