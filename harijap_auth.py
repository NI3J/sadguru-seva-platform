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
    """Get user info from session with enhanced debugging"""
    print(f"🔍 DEBUG: _get_user_info - Session keys: {list(session.keys())}")
    print(f"🔍 DEBUG: _get_user_info - Authenticated: {session.get('authenticated')}")
    print(f"�� DEBUG: _get_user_info - User ID: {session.get('user_id')}")
    
    if not session.get('authenticated'):
        print("🔍 DEBUG: _get_user_info - Not authenticated")
        return None, None, None
    
    user_id = session.get('user_id', '')
    print(f"🔍 DEBUG: _get_user_info - User ID format: {user_id}")
    
    if user_id.startswith('bhaktgan:'):
        bhaktgan_id = user_id.split(':', 1)[1]
        print(f"🔍 DEBUG: _get_user_info - Extracted bhaktgan_id: {bhaktgan_id}")
        return int(bhaktgan_id), session.get('user_name'), session.get('user_mobile')
    
    print("🔍 DEBUG: _get_user_info - User ID format not recognized")
    return None, None, None

def require_harijap_auth(f):
    """Decorator to require authentication for Hari Jap routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"�� DEBUG: require_harijap_auth - Checking authentication for {f.__name__}")
        print(f"🔍 DEBUG: require_harijap_auth - Session authenticated: {session.get('authenticated')}")
        print(f"🔍 DEBUG: require_harijap_auth - Session user_id: {session.get('user_id')}")
        
        if not session.get('authenticated') or not session.get('user_id'):
            print("🔍 DEBUG: require_harijap_auth - Redirecting to auth page")
            return redirect(url_for('harijap_auth.auth_page'))
        return f(*args, **kwargs)
    return decorated_function

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/auth')
def auth_page():
    """Render Hari Jap login page"""
    print("🔍 DEBUG: AUTH_PAGE_ACCESSED")
    
    # Check if already authenticated
    if session.get('authenticated') and session.get('user_id'):
        print("🔍 DEBUG: Already authenticated, redirecting to harijap")
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
        
        print(f"🔍 DEBUG: Login attempt - Name: {name}, Mobile: {mobile}")

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
        
        print(f"🔍 DEBUG: Database query result: {row}")

        if not row:
            return jsonify({'success': False, 'error': 'रिकॉर्ड नहीं मिला। नाम/मोबाइल जाँचें।'}), 404

        # Success: set session and redirect
        print(f"🔍 DEBUG: Setting session for user: {row['id']}")
        session['authenticated'] = True
        session['user_id'] = f"bhaktgan:{row['id']}"
        session['user_name'] = row['name']
        session['user_mobile'] = mobile
        session.permanent = True
        
        print(f"🔍 DEBUG: Session set - authenticated: {session.get('authenticated')}")
        print(f"🔍 DEBUG: Session set - user_id: {session.get('user_id')}")
        print(f"🔍 DEBUG: Session set - user_name: {session.get('user_name')}")

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
    """Check if user session is valid"""
    authenticated = session.get('authenticated', False)
    user_id = session.get('user_id', '')
    user_name = session.get('user_name', '')
    
    print(f"🔍 DEBUG: Session check - Authenticated: {authenticated}")
    print(f"🔍 DEBUG: Session check - User ID: {user_id}")
    print(f"🔍 DEBUG: Session check - User Name: {user_name}")
    
    return jsonify({
        'authenticated': authenticated,
        'user_id': user_id,
        'user_name': user_name
    }), 200

# ============================================================================
# API ROUTES FOR HARI JAP PROGRESS
# ============================================================================

@harijap_auth_bp.route('/harijap/api/state', methods=['GET'])
def harijap_get_state():
    """Get user's current Hari Jap progress state"""
    print("🔍 DEBUG: harijap_get_state called")
    bhaktgan_id, name, phone = _get_user_info()
    
    if not bhaktgan_id:
        print("🔍 DEBUG: harijap_get_state - No bhaktgan_id, returning 401")
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
        
        print(f"🔍 DEBUG: harijap_get_state - Database result: {row}")

        if not row:
            # Create new record for this user
            print(f"🔍 DEBUG: harijap_get_state - Creating new record for bhaktgan_id: {bhaktgan_id}")
            cursor.execute("""
                INSERT INTO harijap_progress (bhaktgan_id, name, phone, count, total_malas)
                VALUES (%s, %s, %s, 0, 0)
            """, (bhaktgan_id, name, phone))
            conn.commit()
            row = {'count': 0, 'total_malas': 0, 'last_spoken_at': None}

        print(f"🔍 DEBUG: harijap_get_state - Returning data: {row}")
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
    print("🔍 DEBUG: harijap_save_state called")
    bhaktgan_id, name, phone = _get_user_info()
    
    if not bhaktgan_id:
        print("�� DEBUG: harijap_save_state - No bhaktgan_id, returning 401")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        data = request.get_json() or {}
        count = int(data.get('count', 0))
        total_malas = int(data.get('totalMalas', 0))
        
        print(f"🔍 DEBUG: harijap_save_state - Saving: count={count}, total_malas={total_malas}")

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Update or insert user progress record
        cursor.execute("""
            INSERT INTO harijap_progress (bhaktgan_id, name, phone, count, total_malas, last_spoken_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                count = VALUES(count),
                total_malas = VALUES(total_malas),
                last_spoken_at = NOW(),
                updated_at = NOW()
        """, (bhaktgan_id, name, phone, count, total_malas))
        
        conn.commit()
        print(f"🔍 DEBUG: harijap_save_state - Successfully saved")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"harijap_save_state error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/api/stats', methods=['GET'])
def harijap_get_stats():
    """Get detailed user statistics"""
    bhaktgan_id, name, phone = _get_user_info()
    if not bhaktgan_id:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Get user progress
        cursor.execute("""
            SELECT count, total_malas, last_spoken_at, created_at, updated_at
            FROM harijap_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        progress = cursor.fetchone()

        # Get user info from bhaktgan
        cursor.execute("""
            SELECT name, city, submitted_at
            FROM bhaktgan 
            WHERE id = %s
        """, (bhaktgan_id,))
        user_info = cursor.fetchone()

        return jsonify({
            'success': True,
            'progress': progress or {'count': 0, 'total_malas': 0},
            'user_info': user_info or {}
        }), 200
        
    except Exception as e:
        print(f"harijap_get_stats error: {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@harijap_auth_bp.route('/harijap/api/leaderboard', methods=['GET'])
def harijap_leaderboard():
    """Get leaderboard of top users"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT hp.name, hp.count, hp.total_malas, hp.last_spoken_at, bg.city
            FROM harijap_progress hp
            JOIN bhaktgan bg ON hp.bhaktgan_id = bg.id
            ORDER BY hp.count DESC
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
    """Get aggregated statistics by city"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT bg.city, 
                   COUNT(hp.bhaktgan_id) as user_count,
                   SUM(hp.count) as total_count,
                   SUM(hp.total_malas) as total_malas,
                   AVG(hp.count) as avg_count
            FROM harijap_progress hp
            JOIN bhaktgan bg ON hp.bhaktgan_id = bg.id
            WHERE bg.city IS NOT NULL AND bg.city != ''
            GROUP BY bg.city
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

@harijap_auth_bp.route('/harijap/auth/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'session_keys': list(session.keys()),
        'authenticated': session.get('authenticated', False)
    }), 200
