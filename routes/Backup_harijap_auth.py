# routes/harijap_auth.py
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from db_config import get_db_connection
import pymysql
from datetime import datetime, timedelta
import re

harijap_auth_bp = Blueprint('harijap_auth', __name__)

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def normalize_mobile(mobile: str) -> str:
    if not mobile:
        return ''
    digits = ''.join(ch for ch in str(mobile) if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits

def is_valid_mobile(mobile: str) -> bool:
    return bool(re.fullmatch(r'[6-9]\d{9}', normalize_mobile(mobile)))

def is_valid_name(name: str) -> bool:
    if not name or len(name.strip()) < 2 or len(name.strip()) > 50:
        return False
    return bool(re.fullmatch(r'[A-Za-z\s]+', name.strip()))

@harijap_auth_bp.route('/harijap/auth')
def auth_page():
    if session.get('authenticated') and session.get('user_id'):
        return redirect(url_for('wisdom.harijap'))
    return render_template('harijaplogin.html')

@harijap_auth_bp.route('/harijap/auth/login', methods=['POST'])
def harijap_login_without_otp():
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
    session.clear()
    return jsonify({'success': True, 'message': 'सफलतापूर्वक लॉगआउट हो गए।'}), 200

@harijap_auth_bp.route('/harijap/auth/check_session', methods=['GET'])
def check_session():
    if session.get('authenticated') and session.get('user_id'):
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session.get('user_id'),
                'name': session.get('user_name'),
                'mobile': session.get('user_mobile')
            }
        }), 200
    return jsonify({'authenticated': False}), 200

def require_harijap_auth(f):
    from functools import wraps
    @wraps(f)
    def _wrap(*args, **kwargs):
        if not session.get('authenticated') or not session.get('user_id'):
            return redirect(url_for('wisdom.harijap'))
        return f(*args, **kwargs)
    return _wrap
