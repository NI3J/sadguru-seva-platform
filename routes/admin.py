#!/usr/bin/env python3

import io
import csv
from flask import Blueprint, render_template, request, make_response, session, flash
from db_config import get_db_connection
from pymysql.cursors import DictCursor
from routes.utils import normalize

# 👨‍💼 Create Blueprint
admin_bp = Blueprint('admin', __name__)

# 🔐 Admin Login & Dashboard
@admin_bp.route('/admin_dashboard', methods=['GET', 'POST'])
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
        print("⚠ DB Error:", err)
    finally:
        try: cursor.close()
        except: pass
        try: connection.close()
        except: pass

    return render_template("admin_dashboard.html", show_submission_form=show_submission_form)

# 📊 Bhaktgan Dashboard
@admin_bp.route('/admin/bhaktgan')
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

    return render_template('admin/bhaktgan_dashboard.html', 
                         bhaktgan_list=bhaktgan_list, 
                         current_seva=seva_filter)

# 📄 Export Bhaktgan CSV
@admin_bp.route('/admin/bhaktgan/export')
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
@admin_bp.route('/admin/thoughts', methods=['GET', 'POST'])
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
                print(f"⚠ Failed to add thought: {e}")
                flash("⚠️ Unable to add thought.")
            finally:
                cursor.close()
                conn.close()
    return render_template('admin_thoughts.html')
