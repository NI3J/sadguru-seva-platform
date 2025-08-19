#!/usr/bin/env python3

# 🌟 Core Imports
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_mail import Mail
from flask_moment import Moment
from dotenv import load_dotenv

# 🔗 Import Blueprints
from routes.main import main_bp
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.wisdom import wisdom_bp
from routes.programs import programs_bp
from routes.utils import send_email

# 📦 Load Environment Variables
load_dotenv()
load_dotenv("database.env")

def create_app():
    # 🚀 Initialize Flask App
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.secret_key = os.getenv("SECRET_KEY", os.urandom(24).hex())

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
    
    # 📧 Make mail available to blueprints
    app.mail = mail
    
    # 🗺️ Register Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(wisdom_bp)
    app.register_blueprint(programs_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("🕉️ Spiritual Flask app launching...")
    app.run(debug=True, host='0.0.0.0', port=5000)
