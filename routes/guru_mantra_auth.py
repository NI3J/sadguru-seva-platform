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

guru_mantra_auth_bp = Blueprint('guru_mantra_auth', __name__)

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
    """Normalize mobile number to last 10 digits."""
    if not mobile:
        return ''
    digits = ''.join(ch for ch in str(mobile) if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


def is_valid_mobile(mobile: str) -> bool:
    """Validate Indian mobile number (starts with 6-9, 10 digits total)."""
    return bool(re.fullmatch(r'[6-9]\d{9}', normalize_mobile(mobile)))


def is_valid_name(name: str) -> bool:
    """Validate name (only alphabets and spaces, 2-50 characters)."""
    if not name or len(name.strip()) < 2 or len(name.strip()) > 50:
        return False
    return bool(re.fullmatch(r'[A-Za-z\s]+', name.strip()))


def send_otp_via_fast2sms(mobile, otp):
    """Send OTP via Fast2SMS API."""
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
    """Get user info from session."""
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


def require_guru_mantra_auth(f):
    """Decorator to require authentication for Guru Mantra routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"DEBUG: Checking auth for {f.__name__}")
        
        if not session.get('authenticated') or not session.get('user_id'):
            print("DEBUG: Not authenticated, redirecting to auth page")
            return redirect(url_for('guru_mantra_auth.auth_page'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@guru_mantra_auth_bp.route('/guru-mantra/auth')
def auth_page():
    """Render Guru Mantra login page."""
    print("DEBUG: Auth page accessed")
    
    if session.get('authenticated') and session.get('user_id'):
        print("DEBUG: Already authenticated, redirecting to guru-mantra")
        return redirect(url_for('guru_mantra_auth.guru_mantra'))
    
    return render_template('gurumantralogin.html')


@guru_mantra_auth_bp.route('/guru-mantra/auth/send_otp', methods=['POST'])
def send_otp():
    """Send OTP to user's mobile number after validating name and mobile."""
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
        session['guru_mantra_otp'] = otp
        session['guru_mantra_otp_mobile'] = mobile
        session['guru_mantra_otp_name'] = name
        session['guru_mantra_otp_user_id'] = row['id']
        session['guru_mantra_otp_expiry'] = (datetime.now() + timedelta(minutes=10)).isoformat()
        session['guru_mantra_otp_attempts'] = 0
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


@guru_mantra_auth_bp.route('/guru-mantra/auth/verify_otp', methods=['POST'])
def verify_otp():
    """Verify OTP and create authenticated session."""
    try:
        data = request.get_json() or {}
        otp = (data.get('otp') or '').strip()
        
        print(f"DEBUG: OTP verification request - OTP: {otp}")

        # Check if OTP exists in session
        if 'guru_mantra_otp' not in session:
            return jsonify({
                'success': False,
                'error': 'OTP समय सीमा समाप्त हो गई। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Check OTP expiry
        otp_expiry = datetime.fromisoformat(session.get('guru_mantra_otp_expiry', ''))
        if datetime.now() > otp_expiry:
            session.pop('guru_mantra_otp', None)
            return jsonify({
                'success': False,
                'error': 'OTP समय सीमा समाप्त हो गई। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Check OTP attempts (max 5 attempts)
        otp_attempts = session.get('guru_mantra_otp_attempts', 0)
        if otp_attempts >= 5:
            session.pop('guru_mantra_otp', None)
            return jsonify({
                'success': False,
                'error': 'अधिकतम प्रयास समाप्त। कृपया नया OTP प्राप्त करें।'
            }), 400

        # Validate OTP input
        if not otp or len(otp) != 6 or not otp.isdigit():
            session['guru_mantra_otp_attempts'] = otp_attempts + 1
            return jsonify({
                'success': False,
                'error': 'कृपया 6 अंकों का OTP दर्ज करें।'
            }), 400

        # Verify OTP
        stored_otp = session.get('guru_mantra_otp', '')
        if otp != stored_otp:
            session['guru_mantra_otp_attempts'] = otp_attempts + 1
            remaining = 5 - (otp_attempts + 1)
            return jsonify({
                'success': False,
                'error': f'गलत OTP। {remaining} प्रयास शेष हैं।'
            }), 400

        # OTP verified - create authenticated session
        user_id = session.get('guru_mantra_otp_user_id')
        user_name = session.get('guru_mantra_otp_name')
        user_mobile = session.get('guru_mantra_otp_mobile')
        
        # Clear OTP data
        session.pop('guru_mantra_otp', None)
        session.pop('guru_mantra_otp_mobile', None)
        session.pop('guru_mantra_otp_name', None)
        session.pop('guru_mantra_otp_user_id', None)
        session.pop('guru_mantra_otp_expiry', None)
        session.pop('guru_mantra_otp_attempts', None)

        # Set authenticated session
        session['guru_mantra_authenticated'] = True
        session['guru_mantra_user_id'] = f"bhaktgan:{user_id}"
        session['guru_mantra_user_name'] = user_name
        session['guru_mantra_user_mobile'] = user_mobile
        session.permanent = True
        
        print(f"DEBUG: OTP verified successfully - User: {user_name}")

        return jsonify({
            'success': True,
            'message': 'स्वागत है! जय श्री कृष्ण।',
            'redirect_url': url_for('guru_mantra_auth.guru_mantra')
        }), 200

    except Exception as e:
        print(f"ERROR: OTP verification failed - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'सर्वर त्रुटि। कृपया फिर से प्रयास करें।'
        }), 500


@guru_mantra_auth_bp.route('/guru-mantra/auth/logout', methods=['POST'])
def logout():
    """Logout user from Guru Mantra session."""
    user_id = session.get('guru_mantra_user_id')
    print(f"DEBUG: User logout - User ID: {user_id}")
    session.pop('guru_mantra_authenticated', None)
    session.pop('guru_mantra_user_id', None)
    session.pop('guru_mantra_user_name', None)
    session.pop('guru_mantra_user_mobile', None)
    
    return jsonify({
        'success': True, 
        'message': 'सफलतापूर्वक लॉगआउट हो गया'
    }), 200


@guru_mantra_auth_bp.route('/guru-mantra/auth/check_session', methods=['GET'])
def check_session():
    """Check if user session is valid."""
    authenticated = session.get('guru_mantra_authenticated', False)
    user_id = session.get('guru_mantra_user_id', '')
    user_name = session.get('guru_mantra_user_name', '')
    
    print(f"DEBUG: Session check - Authenticated: {authenticated}, User: {user_name}")
    
    return jsonify({
        'authenticated': authenticated,
        'user_id': user_id,
        'user_name': user_name
    }), 200


# ============================================================================
# GURU MANTRA PROGRESS API ROUTES
# ============================================================================

@guru_mantra_auth_bp.route('/guru-mantra/api/state', methods=['GET'])
def guru_mantra_get_state():
    """
    Get user's current Guru Mantra progress state.
    
    CRITICAL: Resets today's count at IST 12:00 AM daily.
    Total count NEVER resets.
    """
    print("DEBUG: guru_mantra_get_state called")
    
    # Check authentication
    if not session.get('guru_mantra_authenticated') or not session.get('guru_mantra_user_id'):
        print("DEBUG: Unauthorized")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    user_id = session.get('guru_mantra_user_id', '')
    if not user_id.startswith('bhaktgan:'):
        return jsonify({'success': False, 'error': 'Invalid user ID'}), 401
    
    bhaktgan_id = int(user_id.split(':', 1)[1])
    name = session.get('guru_mantra_user_name', '')
    phone = session.get('guru_mantra_user_mobile', '')

    conn = None
    cursor = None
    
    try:
        # Get current IST date for comparison
        from datetime import timezone, timedelta
        ist = timezone(timedelta(hours=5, minutes=30))
        current_ist_date = datetime.now(ist).strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Get user progress
        cursor.execute("""
            SELECT count, total_malas, current_mala_pronunciations, 
                   total_pronunciations, last_spoken_at,
                   today_pronunciations, today_malas, today_date,
                   todays_count
            FROM guru_mantra_progress 
            WHERE bhaktgan_id = %s
        """, (bhaktgan_id,))
        
        row = cursor.fetchone()
        print(f"DEBUG: Database result: {row}")

        # Create new record if doesn't exist
        if not row:
            print(f"DEBUG: Creating new record for bhaktgan_id: {bhaktgan_id}")
            cursor.execute("""
                INSERT INTO guru_mantra_progress 
                (bhaktgan_id, name, phone, count, total_malas, 
                 current_mala_pronunciations, total_pronunciations,
                 today_pronunciations, today_malas, today_date,
                 todays_count)
                VALUES (%s, %s, %s, 0, 0, 0, 0, 0, 0, %s, 0)
            """, (bhaktgan_id, name, phone, current_ist_date))
            conn.commit()
            
            row = {
                'count': 0, 
                'total_malas': 0, 
                'current_mala_pronunciations': 0,
                'total_pronunciations': 0,
                'last_spoken_at': None,
                'today_pronunciations': 0,
                'today_malas': 0,
                'today_date': current_ist_date,
                'todays_count': 0
            }
        else:
            # Check if date has changed (IST 12:00 AM passed)
            stored_date = None
            if row.get('today_date'):
                if isinstance(row['today_date'], str):
                    stored_date = row['today_date']
                else:
                    stored_date = row['today_date'].strftime('%Y-%m-%d') if hasattr(row['today_date'], 'strftime') else str(row['today_date'])
            
            # Reset today's count if date changed (IST midnight passed)
            if stored_date != current_ist_date:
                print(f"DEBUG: Date changed from {stored_date} to {current_ist_date} (IST). Resetting today's count.")
                
                cursor.execute("""
                    UPDATE guru_mantra_progress 
                    SET today_pronunciations = 0,
                        today_malas = 0,
                        today_date = %s,
                        todays_count = 0,
                        current_mala_pronunciations = 0
                    WHERE bhaktgan_id = %s
                """, (current_ist_date, bhaktgan_id))
                conn.commit()
                
                row['today_pronunciations'] = 0
                row['today_malas'] = 0
                row['today_date'] = current_ist_date
                row['todays_count'] = 0
                row['current_mala_pronunciations'] = 0
                
                print(f"DEBUG: Today's count reset. Total count preserved: {row['count']}")

        today_date_str = None
        if row.get('today_date'):
            if isinstance(row['today_date'], str):
                today_date_str = row['today_date']
            else:
                today_date_str = row['today_date'].strftime('%Y-%m-%d') if hasattr(row['today_date'], 'strftime') else str(row['today_date'])
        else:
            today_date_str = current_ist_date
        
        print(f"DEBUG: Returning state - today_date: {today_date_str}")
        
        return jsonify({
            'success': True, 
            'count': row['count'],  # Total count - NEVER resets
            'total_malas': row['total_malas'],  # Total malas - NEVER resets
            'current_mala_pronunciations': row.get('current_mala_pronunciations', 0),
            'total_pronunciations': row.get('total_pronunciations', 0),  # Total pronunciations - NEVER resets
            'last_spoken_at': row['last_spoken_at'],
            'today_pronunciations': row.get('today_pronunciations', 0),  # Today's pronunciations - resets daily
            'today_malas': row.get('today_malas', 0),  # Today's malas - resets daily
            'today_date': today_date_str,
            'todays_count': row.get('todays_count', 0)  # Today's count - resets daily
        }), 200
        
    except Exception as e:
        print(f"ERROR: guru_mantra_get_state - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@guru_mantra_auth_bp.route('/guru-mantra/api/save', methods=['POST'])
def guru_mantra_save_state():
    """Save user's Guru Mantra progress state."""
    print("DEBUG: guru_mantra_save_state called")
    
    # Check authentication
    if not session.get('guru_mantra_authenticated') or not session.get('guru_mantra_user_id'):
        print("DEBUG: Unauthorized")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    user_id = session.get('guru_mantra_user_id', '')
    if not user_id.startswith('bhaktgan:'):
        return jsonify({'success': False, 'error': 'Invalid user ID'}), 401
    
    bhaktgan_id = int(user_id.split(':', 1)[1])
    name = session.get('guru_mantra_user_name', '')
    phone = session.get('guru_mantra_user_mobile', '')

    conn = None
    cursor = None
    
    try:
        data = request.get_json() or {}
        
        count = int(data.get('count', 0))
        total_malas = int(data.get('totalMalas', 0))
        current_mala_pronunciations = int(data.get('currentMalaPronunciations', 0))
        total_pronunciations = int(data.get('totalPronunciations', 0))
        today_pronunciations = int(data.get('todayPronunciations', 0))
        today_malas = int(data.get('todayMalas', 0))
        today_date = data.get('todayDate')
        todays_count = int(data.get('todaysCount', 0))
        
        # Convert JavaScript date string to MySQL date format if needed
        if today_date and isinstance(today_date, str):
            try:
                from datetime import datetime, timezone, timedelta
                if 'GMT' in today_date or 'UTC' in today_date:
                    dt = datetime.fromisoformat(today_date.replace('Z', '+00:00'))
                    today_date = dt.strftime('%Y-%m-%d')
                elif 'T' in today_date:
                    dt = datetime.fromisoformat(today_date.split('T')[0])
                    today_date = dt.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                ist = timezone(timedelta(hours=5, minutes=30))
                today_date = datetime.now(ist).strftime('%Y-%m-%d')
        elif not today_date:
            from datetime import datetime, timezone, timedelta
            ist = timezone(timedelta(hours=5, minutes=30))
            today_date = datetime.now(ist).strftime('%Y-%m-%d')
        
        print(f"DEBUG: Saving - count={count}, malas={total_malas}")

        conn = get_db_connection()
        cursor = get_cursor(conn)

        # Check if date has changed (IST 12:00 AM passed) before saving
        cursor.execute("""
            SELECT today_date, count as stored_count
            FROM guru_mantra_progress 
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
        if stored_date and stored_date != today_date:
            print(f"DEBUG: Date changed from {stored_date} to {today_date} during save. Resetting today's fields.")
            today_pronunciations = 0
            today_malas = 0
            todays_count = 0
            current_mala_pronunciations = 0

        # Insert or update with all fields
        cursor.execute("""
            INSERT INTO guru_mantra_progress 
            (bhaktgan_id, name, phone, count, total_malas, 
             current_mala_pronunciations, total_pronunciations, 
             last_spoken_at, updated_at, today_pronunciations, 
             today_malas, today_date, todays_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                count = GREATEST(count, VALUES(count)),
                total_malas = GREATEST(total_malas, VALUES(total_malas)),
                current_mala_pronunciations = VALUES(current_mala_pronunciations),
                total_pronunciations = GREATEST(total_pronunciations, VALUES(total_pronunciations)),
                last_spoken_at = NOW(),
                updated_at = NOW(),
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
              today_pronunciations, today_malas, today_date, todays_count))
        
        conn.commit()
        print("DEBUG: Successfully saved to database")
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"ERROR: guru_mantra_save_state - {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Server error'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@guru_mantra_auth_bp.route('/guru-mantra')
@require_guru_mantra_auth
def guru_mantra():
    """Render Guru Mantra sadhana page."""
    return render_template('gurumantra.html')


@guru_mantra_auth_bp.route('/guru-mantra/api/server_time', methods=['GET'])
def get_server_time():
    """Get current server time for date calculations."""
    from datetime import timezone, timedelta
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
