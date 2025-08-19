#!/usr/bin/env python3

import hashlib
import datetime
from datetime import date
from flask import Blueprint, render_template, request
from db_config import get_db_connection
from pymysql.cursors import DictCursor

# 📖 Create Blueprint
wisdom_bp = Blueprint('wisdom', __name__)

# 📖 Wisdom Feed
@wisdom_bp.route('/wisdom/')
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
        print("⚠ Error loading wisdom:", e)
        return "🧘 Unable to load Sadguru's thought today."
    finally:
        cursor.close()
        conn.close()

    return render_template('wisdom.html', quotes=[(thought,)])

# 🗃️ Wisdom Archive
@wisdom_bp.route('/wisdom/archive')
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

# 📿 Mantra Page
@wisdom_bp.route('/knowledge/mantra')
def show_rudraashtakam():
    return render_template('knowledge/mantra.html')

# 🕉️ Shiv Tandav
@wisdom_bp.route('/knowledge/shivtandav')
def shivtandav():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT verse_number, content FROM shivtandav_lyrics WHERE language = 'mr' ORDER BY verse_number")
    lyrics = cursor.fetchall()

    conn.close()

    return render_template('knowledge/shivtandav.html', lyrics=lyrics)

# 🎧 Audio Flow
@wisdom_bp.route('/knowledge/audio_flow')
def audio_flow():
    # 🎧 Bhakti Geet audio files from /static/audio/Bhaktigeet/
    audios = [
        'Sare-tirath-dham.mp3',
        'Shree-Krashna-Govind-Hare-Murare.mp3',
        'Vithal-Maza.mp3'
    ]

    # 🖼️ Baba images from /static/images/Baba/
    images = [
        'Baba1.jpeg',
        'Baba2.jpeg',
        'Baba3.jpeg'
    ]

    return render_template(
        'knowledge/audio_flow.html',
        audios=audios,
        images=images
    )

# Helper functions for satsang
def get_today_page_number(start_date):
    """🌿 Calculate today's satsang page number based on start date."""
    return (date.today() - start_date).days + 1

def fetch_satsang(page_number):
    """📖 Fetch satsang content from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT title, content, content_en, author
        FROM satsang
        WHERE page_number = %s AND is_active = 1
    """
    cursor.execute(query, (page_number,))
    satsang = cursor.fetchone()
    conn.close()
    return satsang

# 🕉️ Daily Satsang
@wisdom_bp.route('/knowledge/satsang')
def daily_satsang():
    """🕉️ Serve daily satsang page with fallback and navigation."""
    start_date = date(2025, 8, 17)

    # 🔢 Determine page number from query or today's date
    page_param = request.args.get('page')
    page_number = int(page_param) if page_param and page_param.isdigit() else get_today_page_number(start_date)

    # 📖 Fetch satsang from DB
    satsang = fetch_satsang(page_number)

    # 🌸 Fallback satsang if none found
    if not satsang:
        satsang = {
            'title': 'सत्संग उपलब्ध नाही',
            'content': 'आज सत्संग उपलब्ध नाही. कृपया उद्या प्रयत्न करा.',
            'content_en': '',
            'author': 'सद्गुरू कृपा'
        }
        next_page = None
    else:
        next_page = page_number + 1

    # 🎨 Render satsang page
    return render_template(
        'knowledge/satsang.html',
        satsang=satsang,
        next_page=next_page
    )
