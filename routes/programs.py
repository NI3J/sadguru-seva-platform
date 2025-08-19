#!/usr/bin/env python3

import os
import datetime
from collections import defaultdict
from flask import Blueprint, render_template, request, flash, redirect, url_for, session, current_app
from db_config import get_db_connection
from pymysql.cursors import DictCursor

# 📅 Create Blueprint
programs_bp = Blueprint('programs', __name__)

# 📅 View Daily Programs
@programs_bp.route('/programs')
def programs():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(DictCursor)
        cursor.execute("SELECT date, content FROM daily_programs ORDER BY date DESC")
        records = cursor.fetchall()
    except Exception as err:
        print("⚠ Error fetching programs:", err)
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
@programs_bp.route('/submit_program', methods=['POST'])
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
        print("⚠ Database error:", err)
        flash("⚠️ कार्यक्रम नोंदवता आला नाही.")
    finally:
        cursor.close()
        connection.close()

    return redirect(url_for('programs.programs'))

# 📽️ Katha Page
@programs_bp.route('/katha')
def katha():
    video_path = os.path.join(current_app.static_folder, 'videos/sadguru_katha.mp4')
    video_exists = os.path.exists(video_path)
    return render_template('katha.html', video_exists=video_exists)
