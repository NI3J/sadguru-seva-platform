#!/usr/bin/env python3
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌸 Sadguru Seva Platform — Spiritual Flask App Entry Point
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import sys, os
from datetime import datetime, timedelta
import locale
from flask import Flask
from flask_mail import Mail
from flask_moment import Moment
from dotenv import load_dotenv

# 📦 Load Environment Variables
load_dotenv()
load_dotenv("database.env")

# 🧭 Adjust Python Path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 🔗 Import Blueprints
from routes.main import main_bp
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.wisdom import wisdom_bp
from routes.programs import programs_bp
from routes.photos import photos_bp
from routes.japa import japa_bp  # ✅ Newly added blueprint
from routes.utils import send_email
from middleware.auth_middleware import login_required
from routes.japa_auth import japa_auth_bp
from routes.harijap_auth import harijap_auth_bp, require_harijap_auth
from routes.guru_mantra_auth import guru_mantra_auth_bp
from routes.krishna_lila import krishna_lila_bp

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌟 App Factory
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.secret_key = os.getenv("SECRET_KEY", os.urandom(24).hex())

    # 🔧 Session Configuration - CRITICAL FOR HARI JAP AUTH
    app.config.update({
        'PERMANENT_SESSION_LIFETIME': timedelta(hours=24),  # 24 hours session
        'SESSION_COOKIE_SAMESITE': 'Lax',  # Allow cross-site requests
        'SESSION_COOKIE_SECURE': False,    # Allow HTTP (not HTTPS only)
        'SESSION_COOKIE_HTTPONLY': True,  # Prevent XSS attacks
        'SESSION_COOKIE_NAME': 'harijap_session',  # Custom session name
    })

    # 🔧 Mail Configuration
    app.config.update({
        'MAIL_SERVER': os.getenv('MAIL_SERVER'),
        'MAIL_PORT': int(os.getenv('MAIL_PORT', 587)),
        'MAIL_USE_TLS': os.getenv('MAIL_USE_TLS', 'True') == 'True',
        'MAIL_USERNAME': os.getenv('MAIL_USERNAME'),
        'MAIL_PASSWORD': os.getenv('MAIL_PASSWORD'),
        'MAIL_DEFAULT_SENDER': os.getenv('MAIL_DEFAULT_SENDER')
    })

    # 🔌 Initialize Extensions
    mail = Mail(app)
    moment = Moment(app)
    app.mail = mail

    # 🗺️ Register Blueprints
    print("📋 Registering blueprints...")
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(wisdom_bp)
    app.register_blueprint(programs_bp)
    app.register_blueprint(photos_bp)
    app.register_blueprint(japa_bp)  # ✅ Japa blueprint now active
    app.register_blueprint(japa_auth_bp)
    app.register_blueprint(harijap_auth_bp)
    app.register_blueprint(guru_mantra_auth_bp)
    app.register_blueprint(krishna_lila_bp)

    print("✅ All blueprints registered successfully")

    # 🌸 Marathi Date Filters
    register_marathi_filters(app)

    # 🧪 Debug Route
    register_debug_route(app)

    # 🧭 Print All Routes
    print("\n📍 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule}")

    return app

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🗓️ Marathi Date Filters
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def register_marathi_filters(app):
    try:
        locale.setlocale(locale.LC_TIME, 'mr_IN.UTF-8')
        print("✅ Marathi locale set successfully")
    except Exception as e:
        print(f"⚠️ Could not set Marathi locale: {e}")

    @app.template_filter('strftime')
    def datetime_filter(date, fmt='%Y-%m-%d'):
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        return date.strftime(fmt)

    @app.template_filter('weekday_marathi')
    def weekday_marathi_filter(date):
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        weekdays = {
            0: 'सोमवार', 1: 'मंगळवार', 2: 'बुधवार',
            3: 'गुरुवार', 4: 'शुक्रवार', 5: 'शनिवार', 6: 'रविवार'
        }
        return weekdays.get(date.weekday(), '')

    @app.template_filter('format_date_marathi')
    def format_date_marathi_filter(date):
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        months = {
            1: 'जानेवारी', 2: 'फेब्रुवारी', 3: 'मार्च', 4: 'एप्रिल',
            5: 'मे', 6: 'जून', 7: 'जुलै', 8: 'ऑगस्ट',
            9: 'सप्टेंबर', 10: 'ऑक्टोबर', 11: 'नोव्हेंबर', 12: 'डिसेंबर'
        }
        marathi_month = months.get(date.month, str(date.month))
        return f"{date.day} {marathi_month} {date.year}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# �� Debug Template Route
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def register_debug_route(app):
    @app.route('/debug-templates')
    def debug_templates():
        template_folder = app.template_folder
        files = []

        try:
            for root, dirs, filenames in os.walk(template_folder):
                for filename in filenames:
                    if filename.endswith(('.html', '.htm')):
                        rel_path = os.path.relpath(os.path.join(root, filename), template_folder)
                        files.append(rel_path)

            return f"""
            <h1>�� Debug: Template Files</h1>
            <p><strong>Template Folder:</strong> {template_folder}</p>
            <p><strong>Found {len(files)} HTML templates:</strong></p>
            <ul>
                {''.join(f'<li>{f}</li>' for f in sorted(files))}
            </ul>

            <h2>🗺️ Available Routes:</h2>
            <ul>
                {''.join(f'<li><a href="{rule.rule}">{rule.endpoint}: {rule.rule}</a></li>' for rule in app.url_map.iter_rules() if 'GET' in rule.methods)}
            </ul>
            <p><a href="/programs">🔗 Test Programs Route</a></p>
            """
        except Exception as e:
            return f"Debug error: {str(e)}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔥 Launch App
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app = create_app()

if __name__ == '__main__':
    print("🕉️ Spiritual Flask app launching...")
    print(f"📁 Template folder: {app.template_folder}")
    print(f"📁 Static folder: {app.static_folder}")
    print("🔧 Session configuration:")
    print(f"  - PERMANENT_SESSION_LIFETIME: {app.config.get('PERMANENT_SESSION_LIFETIME')}")
    print(f"  - SESSION_COOKIE_SAMESITE: {app.config.get('SESSION_COOKIE_SAMESITE')}")
    print(f"  - SESSION_COOKIE_SECURE: {app.config.get('SESSION_COOKIE_SECURE')}")

    template_check = os.path.join(app.template_folder, 'program', 'program.html')
    if os.path.exists(template_check):
        print(f"✅ Template found: {template_check}")
    else:
        print(f"❌ Template NOT found: {template_check}")

    app.run(debug=True, host='0.0.0.0', port=5000)
