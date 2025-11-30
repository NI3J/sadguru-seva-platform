from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from db_config import get_db_connection
import pymysql
from datetime import datetime, timedelta
import re
from functools import wraps

harijap_auth_bp = Blueprint('harijap_auth', __name__)

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def normalize_mobile(mobile: str) -> str:
    """Normalize mobile number to last 10 digits"""
    if not mobile:
        return ''
    digits = ''.join(ch for ch in str(mobile) if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits

def is_valid_mobile(mobile: str) -> bool:
    """Validate Indian mobile number"""
    return bool(re.fullmatch(r'[6-9]\d{9}', normalize_mobile(mobile)))

def is_valid_name(name: str) -> bool:
    """Validate name (only alphabets and spaces, 2-50 characters)"""
    if not name or len(name.strip()) < 2 or len(name.strip()) > 50:
        return False
    return bool(re.fullmatch(r'[A-Za-z\s]+', name.strip()))

def _get_user_info():
    """Get user info from session"""
    if not session.get('authenticated'):
        return None, None, None
    
    user_id = session.get('user_id', '')
    if user_id.startswith('bhaktgan:'):
        bhaktgan_id = user_id.split(':', 1)[1]
        return int(bhaktgan_id), session.get('user_name'), session.get('user_mobile')
    return None, None, None

def require_harijap_auth(f):
    """Decorator to require authentication for Hari Jap routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated') or not session.get('user_id'):
            return redirect(url_for('harijap_auth.auth_page'))
        return f(*args, **kwargs)
    return decorated_function

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/auth')
def auth_page():
    """Display authentication page for Hari Jap"""
    if session.get('authenticated') and session.get('user_id'):
        return redirect(url_for('wisdom.harijap'))
    return render_template('harijaplogin.html')

@harijap_auth_bp.route('/harijap/auth/login', methods=['POST'])
def harijap_login_without_otp():
    """
    Validate user by name and mobile against bhaktgan table.
    If matched, create authenticated session and redirect to harijap.
    """
    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        mobile = normalize_mobile(data.get('mobile') or '')

        if not is_valid_name(name):
            return jsonify({'success': False, 'error': 'कृपया वैध नाम दर्ज करें (केवल अक्षर, 2-50 वर्ण)'}), 400
        if not is_valid_mobile(mobile):
            return jsonify({'success': False, 'error': 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें'}), 400

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Normalize phone in SQL: strip spaces, dashes, +91, leading zeros; compare last 10 digits
        cursor.execute("""
            SELECT id, name, phone
            FROM bhaktgan
            WHERE RIGHT(REGEXP_REPLACE(REPLACE(REPLACE(REPLACE(IFNULL(phone,''), ' ', ''), '-', ''), '+91', ''), '^0+', ''), 10) = %s
              AND LOWER(TRIM(name)) = LOWER(TRIM(%s))
            LIMIT 1
        """, (mobile, name))
        row = cursor.fetchone()

        if not row:
            return jsonify({'success': False, 'error': 'रिकॉर्ड नहीं मिला। नाम/मोबाइल जाँचें।'}), 404

        # Success: set session and redirect
        session['authenticated'] = True
        session['user_id'] = f"bhaktgan:{row['id']}"
        session['user_name'] = row['name']
        session['user_mobile'] = mobile
        session.permanent = True

        return jsonify({
            'success': True,
            'message': 'स्वागत है! हरि जप साधना शुरू करें।',
            'redirect_url': url_for('wisdom.harijap')
        }), 200

    except Exception as e:
        print(f"login_without_otp error: {e}")
        return jsonify({'success': False, 'error': 'सर्वर त्रुटि। कृपया बाद में कोशिश करें।'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/auth/logout', methods=['POST'])
def logout():
    """Logout user from Hari Jap"""
    print(f"🔍 DEBUG: User logout - User ID: {session.get('user_id')}")
    session.clear()
    return jsonify({'success': True, 'message': 'सफलतापूर्वक लॉगआउट हो गए।'}), 200

@harijap_auth_bp.route('/harijap/auth/check_session', methods=['GET'])
def check_session():
    """Check if user is authenticated for Hari Jap"""
    authenticated = session.get('authenticated') and session.get('user_id')
    print(f"🔍 DEBUG: Session check - Authenticated: {authenticated}")
    
    if authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session.get('user_id'),
                'name': session.get('user_name'),
                'mobile': session.get('user_mobile')
            }
        }), 200
    else:
        return jsonify({'authenticated': False}), 200

# ============================================================================
# HARI JAP PROGRESS API ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/api/state', methods=['GET'])
def harijap_get_state():
    """Get user's current Hari Jap progress state"""
    bhaktgan_id, name, phone = _get_user_info()
    if not bhaktgan_id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Get or create user progress record
        cursor.execute("""
            SELECT count, total_malas, last_spoken_at 
            FROM harijap_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        row = cursor.fetchone()

        if not row:
            # Create new record for this user
            cursor.execute("""
                INSERT INTO harijap_progress (bhaktgan_id, name, phone, count, total_malas)
                VALUES (%s, %s, %s, 0, 0)
            """, (bhaktgan_id, name, phone))
            conn.commit()
            row = {'count': 0, 'total_malas': 0, 'last_spoken_at': None}

        return jsonify({
            'success': True, 
            'count': row['count'], 
            'total_malas': row['total_malas'],
            'last_spoken_at': row['last_spoken_at']
        }), 200
        
    except Exception as e:
        print(f"harijap_get_state error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/api/save', methods=['POST'])
def harijap_save_state():
    """Save user's Hari Jap progress state"""
    bhaktgan_id, name, phone = _get_user_info()
    if not bhaktgan_id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        new_count = int(data.get('count', 0))
        new_malas = int(data.get('totalMalas', 0))
        last_spoken = data.get('lastSpokenAt')  # Optional timestamp

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Update or insert user progress
        cursor.execute("""
            INSERT INTO harijap_progress (bhaktgan_id, name, phone, count, total_malas, last_spoken_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              count = VALUES(count),
              total_malas = VALUES(total_malas),
              last_spoken_at = VALUES(last_spoken_at),
              updated_at = CURRENT_TIMESTAMP
        """, (bhaktgan_id, name, phone, new_count, new_malas, last_spoken))
        conn.commit()

        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"harijap_save_state error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/api/stats', methods=['GET'])
def harijap_get_stats():
    """Get user's detailed Hari Jap statistics"""
    bhaktgan_id, name, phone = _get_user_info()
    if not bhaktgan_id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Get user's progress
        cursor.execute("""
            SELECT count, total_malas, last_spoken_at, created_at, updated_at
            FROM harijap_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        progress = cursor.fetchone()

        # Get user's basic info from bhaktgan
        cursor.execute("""
            SELECT name, phone, city, seva_interest
            FROM bhaktgan 
            WHERE id = %s
        """, (bhaktgan_id,))
        user_info = cursor.fetchone()

        if not progress:
            return jsonify({'success': False, 'error': 'No progress found'}), 404

        return jsonify({
            'success': True,
            'user': {
                'id': bhaktgan_id,
                'name': user_info['name'],
                'phone': user_info['phone'],
                'city': user_info['city'],
                'seva_interest': user_info['seva_interest']
            },
            'progress': {
                'count': progress['count'],
                'total_malas': progress['total_malas'],
                'last_spoken_at': progress['last_spoken_at'],
                'created_at': progress['created_at'],
                'updated_at': progress['updated_at']
            }
        }), 200
        
    except Exception as e:
        print(f"harijap_get_stats error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ============================================================================
# ADMIN/ANALYTICS ROUTES (Optional)
# ============================================================================

@harijap_auth_bp.route('/harijap/api/leaderboard', methods=['GET'])
def harijap_leaderboard():
    """Get Hari Jap leaderboard (top users by count)"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT 
                h.bhaktgan_id,
                h.name,
                h.phone,
                h.count,
                h.total_malas,
                h.last_spoken_at,
                b.city,
                b.seva_interest
            FROM harijap_progress h
            JOIN bhaktgan b ON h.bhaktgan_id = b.id
            ORDER BY h.count DESC, h.total_malas DESC
            LIMIT 50
        """)
        leaderboard = cursor.fetchall()

        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        }), 200
        
    except Exception as e:
        print(f"harijap_leaderboard error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/api/city_stats', methods=['GET'])
def harijap_city_stats():
    """Get Hari Jap statistics by city"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT 
                b.city,
                COUNT(h.bhaktgan_id) as total_users,
                SUM(h.count) as total_count,
                SUM(h.total_malas) as total_malas,
                AVG(h.count) as avg_count_per_user
            FROM bhaktgan b
            LEFT JOIN harijap_progress h ON b.id = h.bhaktgan_id
            WHERE b.city IS NOT NULL AND b.city != ''
            GROUP BY b.city
            ORDER BY total_count DESC
        """)
        city_stats = cursor.fetchall()

        return jsonify({
            'success': True,
            'city_stats': city_stats
        }), 200
        
    except Exception as e:
        print(f"harijap_city_stats error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ============================================================================
# HEALTH CHECK
# ============================================================================

@harijap_auth_bp.route('/harijap/auth/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Hari Jap Auth Service is running',
        'status': 'healthy',
        'version': '2.0',
        'timestamp': datetime.now().isoformat()
    }), 200
