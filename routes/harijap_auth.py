from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from db_config import get_db_connection
import pymysql
from datetime import datetime
import re
from functools import wraps

harijap_auth_bp = Blueprint('harijap_auth', __name__)

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_cursor(conn):
    """Get database cursor with DictCursor"""
    return conn.cursor(pymysql.cursors.DictCursor)


def normalize_mobile(mobile: str) -> str:
    """
    Normalize mobile number to last 10 digits.
    
    Args:
        mobile: Mobile number string
        
    Returns:
        Normalized 10-digit mobile number
    """
    if not mobile:
        return ''
    digits = ''.join(ch for ch in str(mobile) if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


def is_valid_mobile(mobile: str) -> bool:
    """
    Validate Indian mobile number (starts with 6-9, 10 digits total).
    
    Args:
        mobile: Mobile number to validate
        
    Returns:
        True if valid, False otherwise
    """
    return bool(re.fullmatch(r'[6-9]\d{9}', normalize_mobile(mobile)))


def is_valid_name(name: str) -> bool:
    """
    Validate name (only alphabets and spaces, 2-50 characters).
    
    Args:
        name: Name to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not name or len(name.strip()) < 2 or len(name.strip()) > 50:
        return False
    return bool(re.fullmatch(r'[A-Za-z\s]+', name.strip()))


def _get_user_info():
    """
    Get user info from session.
    
    Returns:
        Tuple of (bhaktgan_id, name, phone) or (None, None, None) if not authenticated
    """
    print(f"DEBUG: _get_user_info - Session keys: {list(session.keys())}")
    print(f"DEBUG: Authenticated: {session.get('authenticated')}, User ID: {session.get('user_id')}")
    
    if not session.get('authenticated'):
        print("DEBUG: User not authenticated")
        return None, None, None
    
    user_id = session.get('user_id', '')
    
    if user_id.startswith('bhaktgan:'):
        bhaktgan_id = user_id.split(':', 1)[1]
        print(f"DEBUG: Extracted bhaktgan_id: {bhaktgan_id}")
        return int(bhaktgan_id), session.get('user_name'), session.get('user_mobile')
    
    print("DEBUG: User ID format not recognized")
    return None, None, None


def require_harijap_auth(f):
    """
    Decorator to require authentication for Hari Jap routes.
    Redirects to auth page if not authenticated.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"DEBUG: Checking auth for {f.__name__}")
        
        if not session.get('authenticated') or not session.get('user_id'):
            print("DEBUG: Not authenticated, redirecting to auth page")
            return redirect(url_for('harijap_auth.auth_page'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/auth')
def auth_page():
    """
    Render Hari Jap login page.
    Redirects to harijap if already authenticated.
    """
    print("DEBUG: Auth page accessed")
    
    if session.get('authenticated') and session.get('user_id'):
        print("DEBUG: Already authenticated, redirecting to harijap")
        return redirect(url_for('wisdom.harijap'))
    
    return render_template('harijaplogin.html')


@harijap_auth_bp.route('/harijap/auth/login', methods=['POST'])
def harijap_login_without_otp():
    """
    Validate user by name and mobile against bhaktgan table.
    If matched, create authenticated session and redirect to harijap.
    
    Request JSON:
        {
            "name": "User Name",
            "mobile": "9876543210"
        }
        
    Returns:
        JSON with success status and redirect URL or error message
    """
    conn = None
    cursor = None
    
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        mobile = normalize_mobile(data.get('mobile') or '')
        
        print(f"DEBUG: Login attempt - Name: {name}, Mobile: {mobile}")

        # Validate input
        if not is_valid_name(name):
            return jsonify({
                'success': False, 
                'error': 'कृपया मान्य नाम दर्ज करें (केवल अक्षर, 2-50 अक्षर)'
            }), 400
            
        if not is_valid_mobile(mobile):
            return jsonify({
                'success': False, 
                'error': 'कृपया एक 10 अंकों का मोबाइल नंबर दर्ज करें'
            }), 400

        # Query database
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT id, name, phone
            FROM bhaktgan
            WHERE RIGHT(REGEXP_REPLACE(
                REPLACE(REPLACE(REPLACE(IFNULL(phone,''), ' ', ''), '-', ''), '+91', ''), 
                '^0+', ''
            ), 10) = %s
            AND LOWER(TRIM(name)) = LOWER(TRIM(%s))
            LIMIT 1
        """, (mobile, name))
        
        row = cursor.fetchone()
        print(f"DEBUG: Database query result: {row}")

        if not row:
            return jsonify({
                'success': False, 
                'error': 'उपयोगकर्ता नहीं मिला। नाम/मोबाइल सत्यापित करें।'
            }), 404

        # Set session
        print(f"DEBUG: Setting session for user: {row['id']}")
        session.clear()  # Clear any existing session data
        session['authenticated'] = True
        session['user_id'] = f"bhaktgan:{row['id']}"
        session['user_name'] = row['name']
        session['user_mobile'] = mobile
        session.permanent = True
        
        print(f"DEBUG: Session set successfully - User: {session.get('user_name')}")

        return jsonify({
            'success': True,
            'message': 'स्वागत है! जय श्री कृष्ण।',
            'redirect_url': url_for('wisdom.harijap')
        }), 200

    except Exception as e:
        print(f"ERROR: Login failed - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': 'सर्वर त्रुटि। कृपया फिर से प्रयास करें।'
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@harijap_auth_bp.route('/harijap/auth/logout', methods=['POST'])
def logout():
    """
    Logout user from Hari Jap session.
    
    Returns:
        JSON with success status
    """
    user_id = session.get('user_id')
    print(f"DEBUG: User logout - User ID: {user_id}")
    session.clear()
    
    return jsonify({
        'success': True, 
        'message': 'सफलतापूर्वक लॉगआउट हो गया'
    }), 200


@harijap_auth_bp.route('/harijap/auth/check_session', methods=['GET'])
def check_session():
    """
    Check if user session is valid.
    
    Returns:
        JSON with authentication status and user details
    """
    authenticated = session.get('authenticated', False)
    user_id = session.get('user_id', '')
    user_name = session.get('user_name', '')
    
    print(f"DEBUG: Session check - Authenticated: {authenticated}, User: {user_name}")
    
    return jsonify({
        'authenticated': authenticated,
        'user_id': user_id,
        'user_name': user_name
    }), 200


# ============================================================================
# HARI JAP PROGRESS API ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/api/state', methods=['GET'])
def harijap_get_state():
    """
    Get user's current Hari Jap progress state.
    
    Returns:
        JSON with user's progress data including count, malas, and pronunciations
    """
    print("DEBUG: harijap_get_state called")
    
    bhaktgan_id, name, phone = _get_user_info()
    
    if not bhaktgan_id:
        print("DEBUG: Unauthorized - no bhaktgan_id")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Get user progress with all fields including today's data
        cursor.execute("""
            SELECT count, total_malas, current_mala_pronunciations, 
                   total_pronunciations, last_spoken_at,
                   today_words, today_pronunciations, today_malas, today_date,
                   todays_count
            FROM harijap_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        
        row = cursor.fetchone()
        print(f"DEBUG: Database result: {row}")

        # Create new record if doesn't exist
        if not row:
            print(f"DEBUG: Creating new record for bhaktgan_id: {bhaktgan_id}")
            cursor.execute("""
                INSERT INTO harijap_progress 
                (bhaktgan_id, name, phone, count, total_malas, 
                 current_mala_pronunciations, total_pronunciations,
                 today_words, today_pronunciations, today_malas, today_date,
                 todays_count)
                VALUES (%s, %s, %s, 0, 0, 0, 0, 0, 0, 0, CURDATE(), 0)
            """, (bhaktgan_id, name, phone))
            conn.commit()
            
            row = {
                'count': 0, 
                'total_malas': 0, 
                'current_mala_pronunciations': 0,
                'total_pronunciations': 0,
                'last_spoken_at': None,
                'today_words': 0,
                'today_pronunciations': 0,
                'today_malas': 0,
                'today_date': None,
                'todays_count': 0
            }

        return jsonify({
            'success': True, 
            'count': row['count'], 
            'total_malas': row['total_malas'],
            'current_mala_pronunciations': row.get('current_mala_pronunciations', 0),
            'total_pronunciations': row.get('total_pronunciations', 0),
            'last_spoken_at': row['last_spoken_at'],
            'today_words': row.get('today_words', 0),
            'today_pronunciations': row.get('today_pronunciations', 0),
            'today_malas': row.get('today_malas', 0),
            'today_date': row.get('today_date'),
            'todays_count': row.get('todays_count', 0)
        }), 200
        
    except Exception as e:
        print(f"ERROR: harijap_get_state - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@harijap_auth_bp.route('/harijap/api/save', methods=['POST'])
def harijap_save_state():
    """
    Save user's Hari Jap progress state.
    
    Request JSON:
        {
            "count": 665,
            "totalMalas": 1,
            "currentMalaPronunciations": 25,
            "totalPronunciations": 133
        }
        
    Returns:
        JSON with success status
    """
    print("DEBUG: harijap_save_state called")
    
    bhaktgan_id, name, phone = _get_user_info()
    
    if not bhaktgan_id:
        print("DEBUG: Unauthorized - no bhaktgan_id")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    conn = None
    cursor = None
    
    try:
        data = request.get_json() or {}
        
        # Extract all progress data including today's data
        count = int(data.get('count', 0))
        total_malas = int(data.get('totalMalas', 0))
        current_mala_pronunciations = int(data.get('currentMalaPronunciations', 0))
        total_pronunciations = int(data.get('totalPronunciations', 0))
        today_words = int(data.get('todayWords', 0))
        today_pronunciations = int(data.get('todayPronunciations', 0))
        today_malas = int(data.get('todayMalas', 0))
        today_date = data.get('todayDate')
        todays_count = int(data.get('todaysCount', 0))
        
        # Convert JavaScript date string to MySQL date format if needed
        if today_date and isinstance(today_date, str):
            try:
                from datetime import datetime
                # Handle different date formats from JavaScript
                if 'GMT' in today_date or 'UTC' in today_date:
                    # Parse ISO date string and convert to MySQL format
                    dt = datetime.fromisoformat(today_date.replace('Z', '+00:00'))
                    today_date = dt.strftime('%Y-%m-%d')
                elif 'T' in today_date:
                    # Handle ISO format dates
                    dt = datetime.fromisoformat(today_date.split('T')[0])
                    today_date = dt.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                # If parsing fails, use current date
                today_date = datetime.now().strftime('%Y-%m-%d')
        elif not today_date:
            # If no date provided, use current date
            from datetime import datetime
            today_date = datetime.now().strftime('%Y-%m-%d')
        
        print(f"DEBUG: Saving - count={count}, malas={total_malas}, " 
              f"current_mala={current_mala_pronunciations}, total_pron={total_pronunciations}, "
              f"today_words={today_words}, today_malas={today_malas}, today_date={today_date}")

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Insert or update with all fields including today's data
        cursor.execute("""
            INSERT INTO harijap_progress 
            (bhaktgan_id, name, phone, count, total_malas, 
             current_mala_pronunciations, total_pronunciations, 
             last_spoken_at, updated_at, today_words, today_pronunciations, 
             today_malas, today_date, todays_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                count = VALUES(count),
                total_malas = VALUES(total_malas),
                current_mala_pronunciations = VALUES(current_mala_pronunciations),
                total_pronunciations = VALUES(total_pronunciations),
                last_spoken_at = NOW(),
                updated_at = NOW(),
                today_words = VALUES(today_words),
                today_pronunciations = VALUES(today_pronunciations),
                today_malas = VALUES(today_malas),
                today_date = VALUES(today_date),
                todays_count = VALUES(todays_count)
        """, (bhaktgan_id, name, phone, count, total_malas, 
              current_mala_pronunciations, total_pronunciations,
              today_words, today_pronunciations, today_malas, today_date, todays_count))
        
        conn.commit()
        print("DEBUG: Successfully saved to database")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"ERROR: harijap_save_state - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================================
# STATISTICS AND LEADERBOARD ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/api/stats', methods=['GET'])
def harijap_get_stats():
    """
    Get detailed user statistics.
    
    Returns:
        JSON with user progress and personal info
    """
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
            SELECT count, total_malas, current_mala_pronunciations,
                   total_pronunciations, last_spoken_at, created_at, updated_at
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
            'progress': progress or {
                'count': 0, 
                'total_malas': 0,
                'current_mala_pronunciations': 0,
                'total_pronunciations': 0
            },
            'user_info': user_info or {}
        }), 200
        
    except Exception as e:
        print(f"ERROR: harijap_get_stats - {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@harijap_auth_bp.route('/harijap/api/leaderboard', methods=['GET'])
def harijap_leaderboard():
    """
    Get leaderboard of top users by total count.
    
    Returns:
        JSON with top 50 users
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            SELECT hp.name, hp.count, hp.total_malas, hp.last_spoken_at, bg.city
            FROM harijap_progress hp
            JOIN bhaktgan bg ON hp.bhaktgan_id = bg.id
            WHERE hp.count > 0
            ORDER BY hp.count DESC
            LIMIT 50
        """)
        leaderboard = cursor.fetchall()

        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        }), 200
        
    except Exception as e:
        print(f"ERROR: harijap_leaderboard - {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@harijap_auth_bp.route('/harijap/api/city_stats', methods=['GET'])
def harijap_city_stats():
    """
    Get aggregated statistics by city.
    
    Returns:
        JSON with city-wise statistics
    """
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
        print(f"ERROR: harijap_city_stats - {e}")
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================================
# HEALTH CHECK AND DEBUG ROUTES
# ============================================================================

@harijap_auth_bp.route('/harijap/auth/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        JSON with system status and session info
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'session_active': session.get('authenticated', False),
        'user_name': session.get('user_name', 'anonymous')
    }), 200


@harijap_auth_bp.route('/harijap/api/server_time', methods=['GET'])
def get_server_time():
    """
    Get current server time for date calculations.
    
    Returns:
        JSON with current server date and time
    """
    now = datetime.now()
    return jsonify({
        'success': True,
        'date': now.strftime('%Y-%m-%d'),
        'datetime': now.isoformat(),
        'timezone': 'IST',
        'timestamp': now.timestamp()
    }), 200


@harijap_auth_bp.route('/harijap/auth/test_session', methods=['GET', 'POST'])
def test_session():
    """
    Test session functionality (for debugging).
    
    POST: Set test session data
    GET: Retrieve session data
    """
    if request.method == 'POST':
        data = request.get_json() or {}
        test_value = data.get('test_value', 'test')
        
        print(f"DEBUG: Setting test session - test_value: {test_value}")
        session['test_value'] = test_value
        session['test_authenticated'] = True
        session.permanent = True
        
        return jsonify({
            'success': True,
            'message': 'Test session set',
            'session_data': dict(session)
        }), 200
    else:
        print(f"DEBUG: Getting test session: {dict(session)}")
        return jsonify({
            'success': True,
            'session_data': dict(session),
            'test_value': session.get('test_value'),
            'test_authenticated': session.get('test_authenticated')
        }), 200
