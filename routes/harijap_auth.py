from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from db_config import get_db_connection
import pymysql
from datetime import datetime, timedelta
import re
import os
import random
import requests
from functools import wraps
from dotenv import load_dotenv

# Load environment variables from database.env
load_dotenv('database.env')

harijap_auth_bp = Blueprint('harijap_auth', __name__)

# Fast2SMS Configuration
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")
FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"

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


def send_otp_via_fast2sms(mobile, otp):
    """
    Send OTP via Fast2SMS API.
    
    Args:
        mobile: Mobile number (10 digits)
        otp: 6-digit OTP code
        
    Returns:
        True if SMS sent successfully, False otherwise
    """
    if not FAST2SMS_API_KEY:
        print("ERROR: FAST2SMS_API_KEY not configured")
        return False
    
    try:
        payload = {
            'route': 'otp',
            'variables_values': otp,
            'flash': 0,
            'numbers': mobile
        }
        
        headers = {
            'authorization': FAST2SMS_API_KEY,
            'accept': "*/*",
            'cache-control': "no-cache",
            'content-type': "application/x-www-form-urlencoded"
        }
        
        response = requests.post(FAST2SMS_URL, data=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"DEBUG: Fast2SMS Response: {result}")
            return result.get('return', False)
        else:
            print(f"ERROR: Fast2SMS API error - Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print(f"ERROR: Failed to send OTP via Fast2SMS: {e}")
        return False


def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


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


@harijap_auth_bp.route('/harijap/auth/send_otp', methods=['POST'])
def send_otp():
    """
    Send OTP to user's mobile number after validating name and mobile.
    
    Request JSON:
        {
            "name": "User Name",
            "mobile": "9876543210"
        }
        
    Returns:
        JSON with success status and message
    """
    conn = None
    cursor = None
    
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        mobile = normalize_mobile(data.get('mobile') or '')
        
        print(f"DEBUG: Send OTP request - Name: {name}, Mobile: {mobile}")

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

        # Query database to verify user exists
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

        # Generate OTP
        otp = generate_otp()
        print(f"DEBUG: Generated OTP for {mobile}: {otp}")

        # Store OTP in session (valid for 10 minutes)
        session['otp'] = otp
        session['otp_mobile'] = mobile
        session['otp_name'] = name
        session['otp_user_id'] = row['id']
        session['otp_expiry'] = (datetime.now() + timedelta(minutes=10)).isoformat()
        session['otp_attempts'] = 0
        session.permanent = True

        # Send OTP via Fast2SMS
        sms_sent = send_otp_via_fast2sms(mobile, otp)
        
        if sms_sent:
            masked_mobile = f"******{mobile[-4:]}"
            return jsonify({
                'success': True,
                'message': f'OTP {masked_mobile} नंबर पर भेजा गया है।',
                'requires_otp': True
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'OTP भेजने में विफल। कृपया बाद में पुनः प्रयास करें।'
            }), 500

    except Exception as e:
        print(f"ERROR: Send OTP failed - {e}")
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


@harijap_auth_bp.route('/harijap/auth/verify_otp', methods=['POST'])
def verify_otp():
    """
    Verify OTP and create authenticated session.
    
    Request JSON:
        {
            "otp": "123456"
        }
        
    Returns:
        JSON with success status and redirect URL or error message
    """
    try:
        data = request.get_json() or {}
        otp = (data.get('otp') or '').strip()
        
        print(f"DEBUG: OTP verification request - OTP: {otp}")

        # Check if OTP exists in session
        if 'otp' not in session:
            return jsonify({
                'success': False,
                'error': 'OTP समय सीमा समाप्त हो गई। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Check OTP expiry
        otp_expiry = datetime.fromisoformat(session.get('otp_expiry', ''))
        if datetime.now() > otp_expiry:
            session.pop('otp', None)
            return jsonify({
                'success': False,
                'error': 'OTP समय सीमा समाप्त हो गई। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Check OTP attempts (max 5 attempts)
        otp_attempts = session.get('otp_attempts', 0)
        if otp_attempts >= 5:
            session.pop('otp', None)
            return jsonify({
                'success': False,
                'error': 'अधिकतम प्रयास समाप्त। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Validate OTP input
        if not otp or len(otp) != 6 or not otp.isdigit():
            session['otp_attempts'] = otp_attempts + 1
            return jsonify({
                'success': False,
                'error': 'कृपया 6 अंकों का OTP दर्ज करें।'
            }), 400

        # Verify OTP
        stored_otp = session.get('otp', '')
        if otp != stored_otp:
            session['otp_attempts'] = otp_attempts + 1
            remaining = 5 - (otp_attempts + 1)
            return jsonify({
                'success': False,
                'error': f'गलत OTP। {remaining} प्रयास शेष हैं।'
            }), 400

        # OTP verified - create authenticated session
        user_id = session.get('otp_user_id')
        user_name = session.get('otp_name')
        user_mobile = session.get('otp_mobile')
        
        # Clear OTP data
        session.pop('otp', None)
        session.pop('otp_mobile', None)
        session.pop('otp_name', None)
        session.pop('otp_user_id', None)
        session.pop('otp_expiry', None)
        session.pop('otp_attempts', None)

        # Set authenticated session
        session.clear()
        session['authenticated'] = True
        session['user_id'] = f"bhaktgan:{user_id}"
        session['user_name'] = user_name
        session['user_mobile'] = user_mobile
        session.permanent = True
        
        print(f"DEBUG: OTP verified successfully - User: {user_name}")

        return jsonify({
            'success': True,
            'message': 'स्वागत है! जय श्री कृष्ण।',
            'redirect_url': url_for('wisdom.harijap')
        }), 200

    except Exception as e:
        print(f"ERROR: OTP verification failed - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'सर्वर त्रुटि। कृपया फिर से प्रयास करें।'
        }), 500


@harijap_auth_bp.route('/harijap/auth/login', methods=['POST'])
def harijap_login_without_otp():
    """
    Legacy route - now redirects to OTP-based authentication.
    This route is kept for backward compatibility.
    """
    # Redirect to send_otp for OTP-based authentication
    return send_otp()


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
    
    CRITICAL: Resets today's count (today_words, today_malas, todays_count) at IST 12:00 AM daily.
    Total count (count, total_malas, total_pronunciations) NEVER resets.
    
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
        # Get current IST date for comparison
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        current_ist_date = datetime.now(ist).strftime('%Y-%m-%d')
        
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
                VALUES (%s, %s, %s, 0, 0, 0, 0, 0, 0, 0, %s, 0)
            """, (bhaktgan_id, name, phone, current_ist_date))
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
                'today_date': current_ist_date,
                'todays_count': 0
            }
        else:
            # CRITICAL FIX: Check if date has changed (IST 12:00 AM passed)
            # If date changed, reset today's fields but PRESERVE total count
            stored_date = None
            if row.get('today_date'):
                if isinstance(row['today_date'], str):
                    stored_date = row['today_date']
                else:
                    stored_date = row['today_date'].strftime('%Y-%m-%d') if hasattr(row['today_date'], 'strftime') else str(row['today_date'])
            
            # Reset today's count if date changed (IST midnight passed)
            if stored_date != current_ist_date:
                print(f"DEBUG: Date changed from {stored_date} to {current_ist_date} (IST). Resetting today's count.")
                
                # CRITICAL: Only reset today's fields, NEVER reset total count
                cursor.execute("""
                    UPDATE harijap_progress 
                    SET today_words = 0,
                        today_pronunciations = 0,
                        today_malas = 0,
                        today_date = %s,
                        todays_count = 0,
                        current_mala_pronunciations = 0
                    WHERE bhaktgan_id = %s
                """, (current_ist_date, bhaktgan_id))
                conn.commit()
                
                # Update row dict to reflect reset values
                row['today_words'] = 0
                row['today_pronunciations'] = 0
                row['today_malas'] = 0
                row['today_date'] = current_ist_date
                row['todays_count'] = 0
                row['current_mala_pronunciations'] = 0
                
                print(f"DEBUG: Today's count reset. Total count preserved: {row['count']}")

        return jsonify({
            'success': True, 
            'count': row['count'],  # Total count - NEVER resets
            'total_malas': row['total_malas'],  # Total malas - NEVER resets
            'current_mala_pronunciations': row.get('current_mala_pronunciations', 0),
            'total_pronunciations': row.get('total_pronunciations', 0),  # Total pronunciations - NEVER resets
            'last_spoken_at': row['last_spoken_at'],
            'today_words': row.get('today_words', 0),  # Today's count - resets daily at IST 12:00 AM
            'today_pronunciations': row.get('today_pronunciations', 0),  # Today's pronunciations - resets daily
            'today_malas': row.get('today_malas', 0),  # Today's malas - resets daily
            'today_date': row.get('today_date'),  # Current IST date
            'todays_count': row.get('todays_count', 0)  # Today's count - resets daily
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
                from datetime import datetime, timezone, timedelta
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
                # If parsing fails, use current date in IST timezone
                ist = timezone(timedelta(hours=5, minutes=30))
                today_date = datetime.now(ist).strftime('%Y-%m-%d')
        elif not today_date:
            # CRITICAL FIX: Use IST timezone for date consistency
            from datetime import datetime, timezone, timedelta
            ist = timezone(timedelta(hours=5, minutes=30))
            today_date = datetime.now(ist).strftime('%Y-%m-%d')
        
        print(f"DEBUG: Saving - count={count}, malas={total_malas}, " 
              f"current_mala={current_mala_pronunciations}, total_pron={total_pronunciations}, "
              f"today_words={today_words}, today_malas={today_malas}, today_date={today_date}")

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # CRITICAL: Check if date has changed (IST 12:00 AM passed) before saving
        # Get current stored date to compare
        cursor.execute("""
            SELECT today_date, count as stored_count
            FROM harijap_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        existing_row = cursor.fetchone()
        
        stored_date = None
        if existing_row and existing_row.get('today_date'):
            if isinstance(existing_row['today_date'], str):
                stored_date = existing_row['today_date']
            else:
                stored_date = existing_row['today_date'].strftime('%Y-%m-%d') if hasattr(existing_row['today_date'], 'strftime') else str(existing_row['today_date'])
        
        # If date changed (IST midnight passed), reset today's fields
        # CRITICAL: Total count (count, total_malas, total_pronunciations) NEVER resets
        if stored_date and stored_date != today_date:
            print(f"DEBUG: Date changed from {stored_date} to {today_date} during save. Resetting today's fields.")
            today_words = 0
            today_pronunciations = 0
            today_malas = 0
            todays_count = 0
            current_mala_pronunciations = 0

        # Insert or update with all fields including today's data
        # CRITICAL FIX: Use GREATEST() to ensure total count NEVER decreases
        # This prevents data loss if client sends incorrect values
        # Total count (count, total_malas, total_pronunciations) is NEVER reset
        cursor.execute("""
            INSERT INTO harijap_progress 
            (bhaktgan_id, name, phone, count, total_malas, 
             current_mala_pronunciations, total_pronunciations, 
             last_spoken_at, updated_at, today_words, today_pronunciations, 
             today_malas, today_date, todays_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                count = GREATEST(count, VALUES(count)),
                total_malas = GREATEST(total_malas, VALUES(total_malas)),
                current_mala_pronunciations = VALUES(current_mala_pronunciations),
                total_pronunciations = GREATEST(total_pronunciations, VALUES(total_pronunciations)),
                last_spoken_at = NOW(),
                updated_at = NOW(),
                -- CRITICAL FIX: Use GREATEST for today's counts to prevent data loss
                -- Only update if date matches, otherwise reset (handled by date check above)
                today_words = CASE 
                    WHEN today_date = VALUES(today_date) THEN GREATEST(COALESCE(today_words, 0), VALUES(today_words))
                    ELSE VALUES(today_words)
                END,
                today_pronunciations = CASE 
                    WHEN today_date = VALUES(today_date) THEN GREATEST(COALESCE(today_pronunciations, 0), VALUES(today_pronunciations))
                    ELSE VALUES(today_pronunciations)
                END,
                today_malas = CASE 
                    WHEN today_date = VALUES(today_date) THEN GREATEST(COALESCE(today_malas, 0), VALUES(today_malas))
                    ELSE VALUES(today_malas)
                END,
                today_date = VALUES(today_date),
                todays_count = CASE 
                    WHEN today_date = VALUES(today_date) THEN GREATEST(COALESCE(todays_count, 0), VALUES(todays_count))
                    ELSE VALUES(todays_count)
                END
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
        JSON with current server date and time in IST timezone
    """
    from datetime import timezone, timedelta
    # Create IST timezone (UTC+5:30)
    ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(ist)
    
    return jsonify({
        'success': True,
        'date': now.strftime('%Y-%m-%d'),
        'datetime': now.isoformat(),
        'timezone': 'IST',
        'timestamp': now.timestamp(),
        'hour': now.hour,
        'minute': now.minute,
        'second': now.second
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
