#!/usr/bin/env python3
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌸 Krishna Lila Routes - Sadguru Seva Platform
# routes/krishna_lila.py
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import os
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, session
from datetime import datetime
import mysql.connector
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()
load_dotenv("database.env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Blueprint Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

krishna_lila_bp = Blueprint(
    'krishna_lila', 
    __name__, 
    url_prefix='/krishna-lila'
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔌 Database Connection
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_db_connection():
    """Get MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'metro.proxy.rlwy.net'),
            port=int(os.getenv('MYSQL_PORT', 52774)),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DB', 'railway'),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            autocommit=True
        )
        return connection
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🏠 Main Routes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@krishna_lila_bp.route('/')
def index():
    """Krishna Lila main page with all lilas"""
    try:
        db = get_db_connection()
        if not db:
            flash('Database connection error. Please try again later.', 'error')
            return render_template('error.html'), 500
        
        cursor = db.cursor(dictionary=True)
        
        # Get featured lilas
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE is_active = TRUE AND is_featured = TRUE 
            ORDER BY order_sequence ASC
        """)
        featured_lilas = cursor.fetchall()
        
        # Get all active lilas grouped by category
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE is_active = TRUE 
            ORDER BY category, order_sequence ASC
        """)
        all_lilas = cursor.fetchall()
        
        # Group lilas by category
        lilas_by_category = {}
        for lila in all_lilas:
            category = lila['category']
            if category not in lilas_by_category:
                lilas_by_category[category] = []
            lilas_by_category[category].append(lila)
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) as total_lilas FROM krishna_lila WHERE is_active = TRUE")
        stats = cursor.fetchone()
        
        cursor.close()
        db.close()
        
        return render_template('lila.html', 
                             featured_lilas=featured_lilas,
                             lilas_by_category=lilas_by_category,
                             stats=stats,
                             page_title="कृष्ण लिला - Krishna Lila")
                             
    except Exception as e:
        logger.error(f"Error in krishna_lila index: {e}")
        flash('An error occurred while loading Krishna Lilas.', 'error')
        return render_template('error.html'), 500

@krishna_lila_bp.route('/lila/<int:lila_id>')
def view_lila(lila_id):
    """View individual Krishna Lila"""
    try:
        db = get_db_connection()
        if not db:
            flash('Database connection error. Please try again later.', 'error')
            return render_template('error.html'), 500
        
        cursor = db.cursor(dictionary=True)
        
        # Get specific lila
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE id = %s AND is_active = TRUE
        """, (lila_id,))
        
        lila = cursor.fetchone()
        
        if not lila:
            flash('Krishna Lila not found.', 'error')
            return redirect(url_for('krishna_lila.index'))
        
        # Get related lilas from same category
        cursor.execute("""
            SELECT id, title_english, title_marathi, description_english, description_marathi, thumbnail_url
            FROM krishna_lila 
            WHERE category = %s AND id != %s AND is_active = TRUE 
            ORDER BY order_sequence ASC 
            LIMIT 4
        """, (lila['category'], lila_id))
        
        related_lilas = cursor.fetchall()
        
        cursor.close()
        db.close()
        
        return render_template('view_lila.html', 
                             lila=lila,
                             related_lilas=related_lilas,
                             page_title=f"{lila['title_english']} - {lila['title_marathi']}")
                             
    except Exception as e:
        logger.error(f"Error viewing lila {lila_id}: {e}")
        flash('An error occurred while loading this Krishna Lila.', 'error')
        return redirect(url_for('krishna_lila.index'))

@krishna_lila_bp.route('/category/<category>')
def view_category(category):
    """View all lilas in a specific category"""
    try:
        db = get_db_connection()
        if not db:
            flash('Database connection error. Please try again later.', 'error')
            return render_template('error.html'), 500
        
        cursor = db.cursor(dictionary=True)
        
        # Get lilas from specific category
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE category = %s AND is_active = TRUE 
            ORDER BY order_sequence ASC
        """, (category,))
        
        category_lilas = cursor.fetchall()
        
        if not category_lilas:
            flash(f'No Krishna Lilas found in category: {category}', 'info')
            return redirect(url_for('krishna_lila.index'))
        
        # Category display names
        category_names = {
            'childhood': {'en': 'Childhood Lilas', 'mr': 'बालपण लिला'},
            'youth': {'en': 'Youth Lilas', 'mr': 'युवावस्था लिला'}, 
            'mathura': {'en': 'Mathura Lilas', 'mr': 'मथुरा लिला'},
            'dwarka': {'en': 'Dwarka Lilas', 'mr': 'द्वारका लिला'},
            'devotion': {'en': 'Devotion Stories', 'mr': 'भक्ति कथा'},
            'teachings': {'en': 'Teachings', 'mr': 'शिकवण'},
            'miracles': {'en': 'Divine Miracles', 'mr': 'दिव्य चमत्कार'}
        }
        
        category_title = category_names.get(category, {'en': category.title(), 'mr': category})
        
        cursor.close()
        db.close()
        
        return render_template('category.html', 
                             category_lilas=category_lilas,
                             category=category,
                             category_title=category_title,
                             page_title=f"{category_title['en']} - {category_title['mr']}")
                             
    except Exception as e:
        logger.error(f"Error viewing category {category}: {e}")
        flash('An error occurred while loading this category.', 'error')
        return redirect(url_for('krishna_lila.index'))

@krishna_lila_bp.route('/search')
def search():
    """Search Krishna Lilas"""
    query = request.args.get('q', '').strip()
    
    if not query:
        flash('Please enter a search term.', 'info')
        return redirect(url_for('krishna_lila.index'))
    
    try:
        db = get_db_connection()
        if not db:
            flash('Database connection error. Please try again later.', 'error')
            return render_template('error.html'), 500
        
        cursor = db.cursor(dictionary=True)
        
        # Search in titles, descriptions, and tags
        search_query = f"%{query}%"
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE is_active = TRUE AND (
                title_english LIKE %s OR 
                title_marathi LIKE %s OR
                description_english LIKE %s OR
                description_marathi LIKE %s OR
                tags LIKE %s
            )
            ORDER BY 
                CASE 
                    WHEN title_english LIKE %s OR title_marathi LIKE %s THEN 1
                    WHEN description_english LIKE %s OR description_marathi LIKE %s THEN 2
                    ELSE 3
                END,
                order_sequence ASC
        """, (search_query, search_query, search_query, search_query, search_query, 
              search_query, search_query, search_query, search_query))
        
        search_results = cursor.fetchall()
        
        cursor.close()
        db.close()
        
        return render_template('search.html',
                             search_results=search_results,
                             query=query,
                             page_title=f"Search: {query}")
                             
    except Exception as e:
        logger.error(f"Error searching lilas with query '{query}': {e}")
        flash('An error occurred during search.', 'error')
        return redirect(url_for('krishna_lila.index'))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📱 API Routes (for AJAX requests)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@krishna_lila_bp.route('/api/lilas')
def api_get_lilas():
    """API endpoint to get lilas data"""
    try:
        db = get_db_connection()
        if not db:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = db.cursor(dictionary=True)
        
        # Get query parameters
        category = request.args.get('category')
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        
        # Build query
        query = "SELECT * FROM krishna_lila WHERE is_active = TRUE"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        query += " ORDER BY order_sequence ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        lilas = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for lila in lilas:
            if 'created_at' in lila and lila['created_at']:
                lila['created_at'] = lila['created_at'].isoformat()
            if 'updated_at' in lila and lila['updated_at']:
                lila['updated_at'] = lila['updated_at'].isoformat()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'success': True,
            'data': lilas,
            'count': len(lilas)
        })
        
    except Exception as e:
        logger.error(f"API error in get_lilas: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@krishna_lila_bp.route('/api/lila/<int:lila_id>')
def api_get_lila(lila_id):
    """API endpoint to get single lila data"""
    try:
        db = get_db_connection()
        if not db:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM krishna_lila 
            WHERE id = %s AND is_active = TRUE
        """, (lila_id,))
        
        lila = cursor.fetchone()
        
        if not lila:
            return jsonify({'error': 'Lila not found'}), 404
        
        # Convert datetime objects to strings
        if 'created_at' in lila and lila['created_at']:
            lila['created_at'] = lila['created_at'].isoformat()
        if 'updated_at' in lila and lila['updated_at']:
            lila['updated_at'] = lila['updated_at'].isoformat()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'success': True,
            'data': lila
        })
        
    except Exception as e:
        logger.error(f"API error in get_lila {lila_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Helper Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_category_stats():
    """Get statistics for each category"""
    try:
        db = get_db_connection()
        if not db:
            return {}
        
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT category, COUNT(*) as count 
            FROM krishna_lila 
            WHERE is_active = TRUE 
            GROUP BY category
        """)
        
        stats = cursor.fetchall()
        cursor.close()
        db.close()
        
        return {stat['category']: stat['count'] for stat in stats}
        
    except Exception as e:
        logger.error(f"Error getting category stats: {e}")
        return {}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌸 Context Processors
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@krishna_lila_bp.app_context_processor
def inject_krishna_lila_data():
    """Inject Krishna Lila data into all templates"""
    return {
        'category_stats': get_category_stats(),
        'current_year': datetime.now().year
    }
