from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from db_config import get_db_connection
import pymysql
import requests
import random
import string
from datetime import datetime, timedelta
import re

japa_auth_bp = Blueprint('japa_auth', __name__)

# Fast2SMS Configuration
FAST2SMS_API_KEY = "08J7CR3Syh2YmZLbsAWQUfTcNI9aveEOGBlziVjqwKtpF54MDglWCZbSdV8GkAHKPBrFamI35eOy6MQE"  # Replace with your actual API key
FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def is_valid_mobile(mobile):
    """Validate Indian mobile number"""
    pattern = r'^[6-9]\d{9}$'
    return bool(re.match(pattern, mobile))

def is_valid_name(name):
    """Validate name (only alphabets and spaces, 2-50 characters)"""
    if not name or len(name.strip()) < 2 or len(name.strip()) > 50:
        return False
    pattern = r'^[a-zA-Z\s]+$'
    return bool(re.match(pattern, name.strip()))

def send_otp_via_fast2sms(mobile, otp):
    """Send OTP via Fast2SMS"""
    try:
        payload = {
            'authorization': FAST2SMS_API_KEY,
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
            return result.get('return', False)
        return False
    except Exception as e:
        print(f"Error sending OTP: {e}")
        return False

@japa_auth_bp.route('/auth')
def auth_page():
    """Display authentication page"""
    # If already authenticated, redirect to japa
    if session.get('authenticated') and session.get('user_id'):
        return redirect(url_for('japa.japa_page'))
    
    return render_template('login.html')

@japa_auth_bp.route('/auth/japa/send_otp', methods=['POST'])
def send_otp():
    """Send OTP to mobile number"""
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid request data'}), 400
        
        name = data.get('name', '').strip()
        mobile = data.get('mobile', '').strip()
        
        # Validation
        if not is_valid_name(name):
            return jsonify({
                'success': False, 
                'error': 'कृपया वैध नाम दर्ज करें (केवल अक्षर, 2-50 वर्ण)'
            }), 400
        
        if not is_valid_mobile(mobile):
            return jsonify({
                'success': False, 
                'error': 'कृपया वैध मोबाइल नंबर दर्ज करें (10 अंक)'
            }), 400
        
        # Generate OTP
        otp = generate_otp()
        otp_expiry = datetime.now() + timedelta(minutes=10)  # 10 minutes expiry
        
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        # Check if user exists, create or update
        cursor.execute("SELECT id FROM users WHERE mobile = %s", (mobile,))
        user = cursor.fetchone()
        
        if user:
            # Update existing user
            cursor.execute("""
                UPDATE users 
                SET name = %s, otp = %s, otp_expiry = %s, otp_verified = 0, updated_at = NOW()
                WHERE mobile = %s
            """, (name, otp, otp_expiry, mobile))
            user_id = user['id']
        else:
            # Create new user
            cursor.execute("""
                INSERT INTO users (name, mobile, otp, otp_expiry, otp_verified, created_at, updated_at)
                VALUES (%s, %s, %s, %s, 0, NOW(), NOW())
            """, (name, mobile, otp, otp_expiry))
            user_id = cursor.lastrowid
        
        conn.commit()
        
        # Store user info in session for OTP verification
        session['temp_user_id'] = user_id
        session['temp_mobile'] = mobile
        session['temp_name'] = name
        
        # Send OTP via Fast2SMS
        sms_sent = send_otp_via_fast2sms(mobile, otp)
        
        if sms_sent:
            return jsonify({
                'success': True,
                'message': f'OTP भेजा गया {mobile} पर। 10 मिनट में समाप्त हो जाएगा।'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'OTP भेजने में त्रुटि। कृपया दोबारा कोशिश करें।'
            }), 500
            
    except Exception as e:
        print(f"Error in send_otp: {e}")
        return jsonify({
            'success': False,
            'error': 'सर्वर त्रुटि। कृपया बाद में कोशिश करें।'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@japa_auth_bp.route('/auth/japa/verify_otp', methods=['POST'])
def verify_otp():
    """Verify OTP and authenticate user"""
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid request data'}), 400
        
        otp_entered = data.get('otp', '').strip()
        
        if not otp_entered or len(otp_entered) != 6 or not otp_entered.isdigit():
            return jsonify({
                'success': False,
                'error': 'कृपया 6 अंकों का OTP दर्ज करें'
            }), 400
        
        # Get temp user info from session
        temp_user_id = session.get('temp_user_id')
        temp_mobile = session.get('temp_mobile')
        
        if not temp_user_id or not temp_mobile:
            return jsonify({
                'success': False,
                'error': 'सत्र समाप्त हो गया। कृपया दोबारा कोशिश करें।'
            }), 400
        
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        # Get user and verify OTP
        cursor.execute("""
            SELECT id, name, mobile, otp, otp_expiry 
            FROM users 
            WHERE id = %s AND mobile = %s
        """, (temp_user_id, temp_mobile))
        
        user = cursor.fetchone()
        if not user:
            return jsonify({
                'success': False,
                'error': 'उपयोगकर्ता नहीं मिला'
            }), 404
        
        # Check OTP expiry
        if datetime.now() > user['otp_expiry']:
            return jsonify({
                'success': False,
                'error': 'OTP समाप्त हो गया। कृपया नया OTP मांगें।'
            }), 400
        
        # Verify OTP
        if user['otp'] != otp_entered:
            return jsonify({
                'success': False,
                'error': 'गलत OTP। कृपया सही OTP दर्ज करें।'
            }), 400
        
        # OTP verified successfully
        cursor.execute("""
            UPDATE users 
            SET otp_verified = 1, last_login = NOW(), updated_at = NOW()
            WHERE id = %s
        """, (user['id'],))
        conn.commit()
        
        # Set authenticated session
        session['authenticated'] = True
        session['user_id'] = str(user['id'])  # Convert to string for consistency
        session['user_name'] = user['name']
        session['user_mobile'] = user['mobile']
        
        # Clear temp session data
        session.pop('temp_user_id', None)
        session.pop('temp_mobile', None)
        session.pop('temp_name', None)
        
        return jsonify({
            'success': True,
            'message': 'सफलतापूर्वक लॉगिन हो गए!',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'mobile': user['mobile']
            }
        }), 200
        
    except Exception as e:
        print(f"Error in verify_otp: {e}")
        return jsonify({
            'success': False,
            'error': 'सर्वर त्रुटि। कृपया बाद में कोशिश करें।'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@japa_auth_bp.route('/auth/japa/resend_otp', methods=['POST'])
def resend_otp():
    """Resend OTP to the same mobile number"""
    conn = None
    cursor = None
    try:
        temp_user_id = session.get('temp_user_id')
        temp_mobile = session.get('temp_mobile')
        temp_name = session.get('temp_name')
        
        if not temp_user_id or not temp_mobile or not temp_name:
            return jsonify({
                'success': False,
                'error': 'सत्र समाप्त हो गया। कृपया दोबारा कोशिश करें।'
            }), 400
        
        # Generate new OTP
        otp = generate_otp()
        otp_expiry = datetime.now() + timedelta(minutes=10)
        
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        # Update OTP in database
        cursor.execute("""
            UPDATE users 
            SET otp = %s, otp_expiry = %s, otp_verified = 0, updated_at = NOW()
            WHERE id = %s
        """, (otp, otp_expiry, temp_user_id))
        conn.commit()
        
        # Send new OTP
        sms_sent = send_otp_via_fast2sms(temp_mobile, otp)
        
        if sms_sent:
            return jsonify({
                'success': True,
                'message': f'नया OTP भेजा गया {temp_mobile} पर।'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'OTP भेजने में त्रुटि। कृपया दोबारा कोशिश करें।'
            }), 500
            
    except Exception as e:
        print(f"Error in resend_otp: {e}")
        return jsonify({
            'success': False,
            'error': 'सर्वर त्रुटि। कृपया बाद में कोशिश करें।'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@japa_auth_bp.route('/auth/japa/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'सफलतापूर्वक लॉगआउट हो गए।'
    }), 200

@japa_auth_bp.route('/auth/japa/check_session', methods=['GET'])
def check_session():
    """Check if user is authenticated"""
    if session.get('authenticated') and session.get('user_id'):
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
