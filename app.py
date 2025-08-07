#!/usr/bin/env python3

# 🌐 Core Imports
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import os
import io
import csv
import hashlib
import random
import pymysql
import datetime
from collections import defaultdict
from flask import (
    Flask, render_template, request, redirect, flash, session,
    url_for, make_response
)
from flask_mail import Mail, Message
from dotenv import load_dotenv
from pymysql.cursors import DictCursor
import requests
from db_config import get_db_connection

# 📦 Load Environment Variables
load_dotenv()
load_dotenv("database.env")

# 🚀 Initialize Flask App
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24).hex())

# 📧 Mail Configuration
app.config.update({
    'MAIL_SERVER': os.getenv('MAIL_SERVER'),
    'MAIL_PORT': int(os.getenv('MAIL_PORT', 587)),
    'MAIL_USE_TLS': os.getenv('MAIL_USE_TLS', 'True') == 'True',
    'MAIL_USERNAME': os.getenv('MAIL_USERNAME'),
    'MAIL_PASSWORD': os.getenv('MAIL_PASSWORD'),
    'MAIL_DEFAULT_SENDER': os.getenv('MAIL_DEFAULT_SENDER')
})
mail = Mail(app)

# 📞 Phone Normalizer Utility
def normalize(phone):
    return phone.strip().replace('+91', '').lstrip('0')

# 🔢 OTP Generator
def generate_otp(length=6):
    return str(random.randint(10**(length - 1), 10**length - 1))

# 📲 Send OTP via Fast2SMS
def send_sms(mobile, otp):
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": os.getenv("FAST2SMS_API_KEY"),
        "Content-Type": "application/json"
    }
    payload = {
        "route": "otp",
        "variables_values": otp,
        "numbers": mobile
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print(f"📲 SMS API Response: {response.text}")
        return True
    except Exception as e:
        print("❌ Failed to send OTP:", e)
        return False

# 🌼 Home Page
@app.route('/')
def home():
    print("✅ Home route accessed")
    return render_template('index.html')

# 📖 About Page
@app.route('/about')
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
@app.route('/bhaktgan', methods=['GET', 'POST'])
def bhaktgan():
    print("🔵 /bhaktgan route accessed")

    conn = get_db_connection()
    cursor = conn.cursor()  # Use DictCursor if preferred
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
            print("🔁 Duplicate registration detected.")
        else:
            try:
                # 📝 Insert new bhakt with timestamp
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
                    msg = Message(
                        subject="🌸 Welcome to Bhaktgan",
                        sender=app.config['MAIL_USERNAME'],
                        recipients=[email],
                        html=render_template('bhaktgan_welcome.html', name=name, seva=seva_interest)
                    )
                    mail.send(msg)
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

# 📖 Wisdom Feed
@app.route('/wisdom')
def wisdom_feed():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(DictCursor)
        cursor.execute("SELECT COUNT(*) AS count FROM sadguru_thoughts")
        total = cursor.fetchone()['count']

        if total == 0:
            raise ValueError("No thoughts available in DB.")

        today = datetime.date.today().isoformat()
        index = int(hashlib.sha256(today.encode()).hexdigest(), 16) % total

        cursor.execute("SELECT content FROM sadguru_thoughts LIMIT 1 OFFSET %s", (index,))
        thought = cursor.fetchone()['content']
    except Exception as e:
        print("❌ Error loading wisdom:", e)
        return "🧘 Unable to load Sadguru's thought today."
    finally:
        cursor.close()
        conn.close()

    return render_template('wisdom.html', quotes=[(thought,)])

# 🔐 OTP Request
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    username = request.form.get('username')
    mobile = request.form.get('mobile')

    if not username or not mobile:
        flash("❌ कृपया नाव आणि मोबाईल नंबर भरा.")
        return redirect('/')

    otp = generate_otp()
    session['otp'] = otp
    session['username'] = username

    if not send_sms(mobile, otp):
        flash("❌ OTP पाठवण्यात अडचण आली.")
        return redirect('/')

    return render_template('enter_otp.html', username=username)

# 🔓 OTP Validation
@app.route('/validate-otp', methods=['POST'])
def validate_otp():
    entered_otp = request.form.get('otp')
    actual_otp = session.get('otp')
    username = session.get('username', 'भक्त')

    if entered_otp == actual_otp:
        return render_template('wisdom_access_granted.html', username=username)
    else:
        flash("❌ OTP चुकीचा आहे.")
        return redirect('/retry-otp')

@app.route('/retry-otp')
def retry_otp():
    username = session.get('username', 'भक्त')
    return render_template('enter_otp.html', username=username)

# 📬 Contact Page
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        message_content = request.form.get('message')

        if email:
            try:
                reply_html = render_template('contact_autoreply.html', name=name, message=message_content)
                msg = Message(
                    subject="आपला संदेश प्राप्त झाला आहे 🙏",
                    sender=app.config['MAIL_USERNAME'],
                    recipients=[email],
                    html=reply_html
                )
                mail.send(msg)
            except Exception as e:
                print(f"⚠️ Failed to send contact auto-reply: {e}")

        return render_template('contact.html', success=True)

    return render_template('contact.html')

# 📊 Admin Dashboard
@app.route('/admin/bhaktgan')
def bhaktgan_dashboard():
    seva_filter = request.args.get('seva')
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM bhaktgan"
    params = ()

    if seva_filter:
        query += " WHERE seva_interest = %s"
        params = (seva_filter,)

    query += " ORDER BY submitted_at DESC"
    cursor.execute(query, params)

    bhaktgan_list = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template('admin/bhaktgan_dashboard.html', bhaktgan_list=bhaktgan_list, current_seva=seva_filter)

# 📁 Export CSV
@app.route('/admin/bhaktgan/export')
def export_bhaktgan_csv():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, phone, seva_interest, city, submitted_at FROM bhaktgan")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['नाव', 'ईमेल', 'फोन', 'सेवा', 'शहर', 'नोंदणी वेळ'])
    for row in rows:
        writer.writerow(row)

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=bhaktgan_suchi.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
# 🧘 Thoughts Manager
@app.route('/admin/thoughts', methods=['GET', 'POST'])
def manage_thoughts():
    if request.method == 'POST':
        new_thought = request.form.get('content')
        if new_thought:
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("INSERT INTO sadguru_thoughts (content) VALUES (%s)", (new_thought,))
                conn.commit()
                flash("🙏 Thought added successfully.")
            except Exception as e:
                print(f"❌ Failed to add thought: {e}")
                flash("⚠️ Unable to add thought.")
            finally:
                cursor.close()
                conn.close()
    return render_template('admin_thoughts.html')

# 🗃️ Wisdom Archive
@app.route('/wisdom/archive')
def archive():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT content, added_on FROM sadguru_thoughts ORDER BY added_on DESC")
        thoughts = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
    return render_template('wisdom_archive.html', thoughts=thoughts)

# 📄 Fast2SMS Verification File
@app.route('/fast2sms_verify.txt')
def fast2sms_file():
    return app.send_static_file('fast2sms_verify.txt')

# 📽️ Katha Page
@app.route('/katha')
def katha():
    video_path = os.path.join(app.static_folder, 'videos/sadguru_katha.mp4')
    video_exists = os.path.exists(video_path)
    return render_template('katha.html', video_exists=video_exists)

# 📅 View Daily Programs
@app.route('/programs')
def programs():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(DictCursor)
        cursor.execute("SELECT date, content FROM daily_programs ORDER BY date DESC")
        records = cursor.fetchall()
    except Exception as err:
        print("❌ Error fetching programs:", err)
        records = []
    finally:
        cursor.close()
        connection.close()

    grouped_days = defaultdict(list)
    for entry in records:
        grouped_days[entry['date']].append(entry['content'])

    days = [{'date': date, 'programs': entries} for date, entries in grouped_days.items()]
    today = datetime.date.today().strftime('%Y-%m-%d')

    return render_template('program/program.html', days=days, today=today)

# 📝 Submit Daily Program
@app.route('/submit_program', methods=['POST'])
def submit_program():
    date = request.form.get('date')
    content = request.form.get('content')
    created_by = session.get('admin_name') or session.get('admin_phone')

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO daily_programs (date, content, created_by) VALUES (%s, %s, %s)",
            (date, content, created_by)
        )
        connection.commit()
        flash("📅 कार्यक्रम यशस्वीरीत्या नोंदवला गेला.")
    except Exception as err:
        print("❌ Database error:", err)
        flash("⚠️ कार्यक्रम नोंदवता आला नाही.")
    finally:
        cursor.close()
        connection.close()

    return redirect(url_for('programs'))

# 🔐 Admin Login & Session Validation
@app.route('/admin_dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    show_submission_form = False

    try:
        connection = get_db_connection()
        cursor = connection.cursor(DictCursor)

        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            mobile = normalize(request.form.get('mobile', ''))

            cursor.execute(
                "SELECT * FROM authorized_admins WHERE name = %s AND phone = %s",
                (name, mobile)
            )
            admin = cursor.fetchone()

            if admin:
                session['admin_name'] = name
                session['admin_phone'] = mobile
                show_submission_form = True

        elif session.get('admin_name') and session.get('admin_phone'):
            cursor.execute(
                "SELECT * FROM authorized_admins WHERE name = %s AND phone = %s",
                (session['admin_name'], session['admin_phone'])
            )
            admin = cursor.fetchone()
            show_submission_form = bool(admin)

    except Exception as err:
        print("❌ DB Error:", err)
    finally:
        try: cursor.close()
        except: pass
        try: connection.close()
        except: pass

    return render_template("admin_dashboard.html", show_submission_form=show_submission_form)

# 🚀 Launch Server
if __name__ == '__main__':
    print("🕉️ Spiritual Flask app launching...")
    app.run(debug=True, host='0.0.0.0', port=5000)
