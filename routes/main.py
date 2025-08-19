#!/usr/bin/env python3

import pymysql
from flask import Blueprint, render_template, request, current_app
from db_config import get_db_connection
from routes.utils import send_email

# 🌟 Create Blueprint
main_bp = Blueprint('main', __name__)

# 🌼 Home Page
@main_bp.route('/')
def home():
    print("✅ Home route accessed")
    return render_template('index.html')

# 📖 About Page
@main_bp.route('/about')
def about():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM daily_programs ORDER BY date DESC")
        programs = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()
    return render_template('about.html', programs=programs)

# 🙏 Bhaktgan Registration
@main_bp.route('/bhaktgan/', methods=['GET', 'POST'])
def bhaktgan():
    print("🔵 /bhaktgan route accessed")

    conn = get_db_connection()
    cursor = conn.cursor()
    message = None

    if request.method == 'POST':
        # 🌼 Extract form data
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        city = request.form.get('city')
        seva_interest = request.form.get('seva_interest')

        print(f"📥 Received: {name}, {email}, {phone}, {city}, {seva_interest}")

        # 🔍 Check for existing bhakt by email
        cursor.execute("SELECT COUNT(*) FROM bhaktgan WHERE email=%s", (email,))
        result = cursor.fetchone()
        already_registered = result[0] if isinstance(result, tuple) else result.get('count', 0)

        if already_registered > 0:
            message = "🌸 You're already part of the Bhaktgan."
            print("🔍 Duplicate registration detected.")
        else:
            try:
                # 🔍 Insert new bhakt with timestamp
                cursor.execute(
                    """
                    INSERT INTO bhaktgan (name, email, phone, seva_interest, city, submitted_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    """,
                    (name, email, phone, seva_interest, city)
                )
                conn.commit()
                message = "🕉️ Thank you for joining the Bhaktgan!"
                print("✅ New bhakt registered.")

                # 📧 Send welcome email
                try:
                    welcome_html = render_template('bhaktgan_welcome.html', name=name, seva=seva_interest)
                    send_email(
                        subject="🌸 Welcome to Bhaktgan",
                        recipients=email,
                        html_body=welcome_html
                    )
                    print("📨 Welcome email sent.")
                except Exception as e:
                    print(f"⚠️ Failed to send email: {e}")

            except pymysql.err.IntegrityError:
                message = "🌸 You're already part of the Bhaktgan."
                print("⚠️ IntegrityError: Duplicate email detected.")

    # 📋 Fetch all bhakts
    cursor.execute(
        "SELECT name, email, phone, seva_interest, city, submitted_at FROM bhaktgan ORDER BY id DESC"
    )
    bhakts = cursor.fetchall()

    # 🧹 Cleanup
    cursor.close()
    conn.close()

    # 🎨 Render template
    return render_template('bhaktgan.html', message=message, bhaktgan=bhakts)

# 📬 Contact Page
@main_bp.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        message_content = request.form.get('message')

        if email:
            try:
                reply_html = render_template('contact_autoreply.html', name=name, message=message_content)
                send_email(
                    subject="आपला संदेश प्राप्त झाला आहे 🙏",
                    recipients=email,
                    html_body=reply_html
                )
            except Exception as e:
                print(f"⚠️ Failed to send contact auto-reply: {e}")

        return render_template('contact.html', success=True)

    return render_template('contact.html')

# 📄 Fast2SMS Verification File
@main_bp.route('/fast2sms_verify.txt')
def fast2sms_file():
    return current_app.send_static_file('fast2sms_verify.txt')
