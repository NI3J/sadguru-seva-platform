#!/usr/bin/env python3
import hashlib
import logging
from datetime import date, datetime, timedelta
from flask import Blueprint, render_template, request, jsonify
from db_config import get_db_connection
from pymysql.cursors import DictCursor
import mysql.connector
from mysql.connector import Error

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 📖 Create Blueprint
wisdom_bp = Blueprint('wisdom', __name__)

# Custom exception for satsang-related errors
class SatsangError(Exception):
    """Custom exception for satsang-related errors"""
    pass

# ========== EXISTING WISDOM ROUTES ==========
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
        
        # FIX: Use date.today() instead of datetime.date.today()
        today = date.today().isoformat()
        
        index = int(hashlib.sha256(today.encode()).hexdigest(), 16) % total
        
        cursor.execute("SELECT content FROM sadguru_thoughts LIMIT 1 OFFSET %s", (index,))
        thought = cursor.fetchone()['content']
        
    except Exception as e:
        logger.error(f"Error loading wisdom: {e}")
        return "🧘 Unable to load Sadguru's thought today."
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return render_template('wisdom.html', quotes=[(thought,)])

# 🗃️ Wisdom Archive
@wisdom_bp.route('/wisdom/archive')
def archive():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT content, added_on FROM sadguru_thoughts ORDER BY added_on DESC")
        thoughts = cursor.fetchall()
    except Exception as e:
        logger.error(f"Error loading wisdom archive: {e}")
        thoughts = []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    return render_template('wisdom_archive.html', thoughts=thoughts)

# 📿 Mantra Page
@wisdom_bp.route('/knowledge/mantra')
def show_rudraashtakam():
    return render_template('knowledge/mantra.html')

# 🕉️ Shiv Tandav
@wisdom_bp.route('/knowledge/shivtandav')
def shivtandav():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT verse_number, content FROM shivtandav_lyrics WHERE language = 'mr' ORDER BY verse_number")
        lyrics = cursor.fetchall()
    except Exception as e:
        logger.error(f"Error loading Shiv Tandav: {e}")
        lyrics = []
    finally:
        if cursor:
            cursor.close()
        if conn:
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

# ========== SATSANG MANAGER CLASS ==========

class SatsangManager:
    """Main class to manage satsang operations"""

    def __init__(self, start_date=None, db_connection_func=None):
        self.start_date = start_date or date(2025, 8, 17)
        self.get_db_connection = db_connection_func
        self.marathi_months = [
            'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
            'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
        ]
        self.marathi_days = [
            'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'
        ]

    def get_today_page_number_continuous(self):
        """Calculate page number as days since start date (continuous counting)"""
        today = date.today()
        days_since_start = (today - self.start_date).days + 1  # +1 to start from page 1
        return max(1, days_since_start)  # Ensure minimum page 1

    def get_page_date(self, page_number):
        """Get the date for a specific page number"""
        if page_number < 1:
            raise SatsangError("Page number must be 1 or greater")
        target_date = self.start_date + timedelta(days=page_number - 1)
        return target_date

    def get_days_info(self, current_page):
        """Get comprehensive information about days and progress"""
        try:
            today = date.today()
            page_date = self.get_page_date(current_page)
            days_since_start = (today - self.start_date).days + 1

            return {
                'days_since_start': days_since_start,
                'current_page': current_page,
                'page_date': page_date,
                'is_today': current_page == days_since_start,
                'is_future': current_page > days_since_start,
                'is_past': current_page < days_since_start,
                'days_difference': current_page - days_since_start
            }
        except Exception as e:
            logger.error(f"Error getting days info for page {current_page}: {e}")
            raise SatsangError(f"Unable to calculate days info: {e}")

    def fetch_satsang_continuous(self, page_number):
        """Fetch satsang from database for continuous counting"""
        if not self.get_db_connection:
            logger.error("Database connection function not provided")
            return None

        connection = None
        cursor = None

        try:
            connection = self.get_db_connection()
            # Use standard cursor without dictionary parameter
            cursor = connection.cursor()

            query = """
                SELECT id, title, content, content_en, marathi_content,
                       english_content, author, page_number, created_at,
                       DATE(created_at) as satsang_date
                FROM satsang
                WHERE page_number = %s
                LIMIT 1
            """
            cursor.execute(query, (page_number,))
            result = cursor.fetchone()

            # Convert tuple result to dictionary manually
            if result:
                columns = [
                    'id', 'title', 'content', 'content_en', 'marathi_content',
                    'english_content', 'author', 'page_number', 'created_at',
                    'satsang_date'
                ]
                satsang_dict = dict(zip(columns, result))
                return satsang_dict

            return None

        except Exception as e:
            logger.error(f"Database error fetching satsang for page {page_number}: {e}")
            return None
        finally:
            # Ensure resources are cleaned up
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def get_fallback_satsang(self, page_number, days_info):
        """Generate fallback satsang when no content exists"""
        try:
            page_date = days_info['page_date']
            marathi_date = self.get_marathi_date(page_date)
            english_date = page_date.strftime("%B %d, %Y")

            if days_info['is_future']:
                # Future date
                days_ahead = days_info['days_difference']
                return {
                    'id': 0,
                    'title': 'भविष्यातील सत्संग',
                    'content': f'दिनांक {marathi_date} चा सत्संग अजूनही आलेला नाही.',
                    'content_en': f'The satsang for {english_date} is not yet available.',
                    'marathi_content': f'हा सत्संग आजपासून {days_ahead} दिवसांनी उपलब्ध होईल. कृपया धैर्य धरा.',
                    'english_content': f'This satsang will be available in {days_ahead} days from today. Please be patient.',
                    'author': 'सद्गुरू कृपा',
                    'page_number': page_number,
                    'satsang_date': page_date,
                    'is_fallback': True,
                    'fallback_type': 'future'
                }
            elif days_info['is_past']:
                # Past date without content
                days_ago = abs(days_info['days_difference'])
                return {
                    'id': 0,
                    'title': f'दिवस {page_number} - सत्संग',
                    'content': f'दिनांक {marathi_date} चा सत्संग सामग्री अद्याप तयार झालेली नाही.',
                    'content_en': f'Satsang content for {english_date} is not yet prepared.',
                    'marathi_content': f'हा सत्संग {days_ago} दिवसांपूर्वीचा आहे. सामग्री लवकरच उपलब्ध होईल.',
                    'english_content': f'This satsang is from {days_ago} days ago. Content will be available soon.',
                    'author': 'सद्गुरू कृपा',
                    'page_number': page_number,
                    'satsang_date': page_date,
                    'is_fallback': True,
                    'fallback_type': 'past'
                }
            else:
                # Today's date
                return {
                    'id': 0,
                    'title': 'आजचा सत्संग',
                    'content': f'आज दिनांक {marathi_date} चा सत्संग अद्याप तयार नाही.',
                    'content_en': f'Today\'s satsang for {english_date} is not yet ready.',
                    'marathi_content': 'कृपया काही वेळाने पुन्हा प्रयत्न करा. सद्गुरूंच्या कृपेने आजचा सत्संग लवकरच उपलब्ध होईल.',
                    'english_content': 'Please try again later. Today\'s satsang will be available soon by Sadguru\'s grace.',
                    'author': 'सद्गुरू कृपा',
                    'page_number': page_number,
                    'satsang_date': page_date,
                    'is_fallback': True,
                    'fallback_type': 'today'
                }
        except Exception as e:
            logger.error(f"Error generating fallback satsang for page {page_number}: {e}")
            # Return minimal fallback
            return {
                'id': 0,
                'title': 'सत्संग',
                'content': 'सत्संग सामग्री उपलब्ध नाही.',
                'content_en': 'Satsang content not available.',
                'marathi_content': 'कृपया नंतर प्रयत्न करा.',
                'english_content': 'Please try again later.',
                'author': 'सद्गुरू कृपा',
                'page_number': page_number,
                'satsang_date': date.today(),
                'is_fallback': True,
                'fallback_type': 'error'
            }

    def get_navigation_pages(self, current_page):
        """Get navigation page numbers with bounds checking"""
        try:
            today_page = self.get_today_page_number_continuous()

            # Previous page (minimum 1)
            prev_page = max(1, current_page - 1)

            # Next page (no maximum limit in continuous counting)
            next_page = current_page + 1

            # Limit future navigation (optional - you can remove this)
            max_future_days = 30  # Allow browsing 30 days into future
            max_page = today_page + max_future_days

            return {
                'prev_page': prev_page if current_page > 1 else None,
                'next_page': next_page if current_page < max_page else None,
                'today_page': today_page,
                'first_page': 1,
                'can_go_prev': current_page > 1,
                'can_go_next': current_page < max_page,
                'max_future_days': max_future_days
            }
        except Exception as e:
            logger.error(f"Error getting navigation for page {current_page}: {e}")
            return {
                'prev_page': None,
                'next_page': None,
                'today_page': 1,
                'first_page': 1,
                'can_go_prev': False,
                'can_go_next': False,
                'max_future_days': 30
            }

    def get_marathi_date(self, date_obj):
        """Convert date to Marathi format"""
        try:
            return f"{date_obj.day} {self.marathi_months[date_obj.month - 1]} {date_obj.year}"
        except (IndexError, AttributeError) as e:
            logger.error(f"Error formatting Marathi date: {e}")
            return str(date_obj)

    def get_marathi_day_name(self, date_obj):
        """Get Marathi day name"""
        try:
            return self.marathi_days[date_obj.weekday()]
        except (IndexError, AttributeError) as e:
            logger.error(f"Error getting Marathi day name: {e}")
            return date_obj.strftime("%A")

    def get_satsang_stats(self):
        """Get satsang statistics"""
        if not self.get_db_connection:
            return {'success': False, 'message': 'Database connection not available'}

        connection = None
        cursor = None

        try:
            today_page = self.get_today_page_number_continuous()
            connection = self.get_db_connection()
            cursor = connection.cursor()

            # Count total satsangs in database
            cursor.execute("SELECT COUNT(*) FROM satsang")
            total_in_db = cursor.fetchone()[0]

            # Count satsangs by page number range
            cursor.execute("SELECT MIN(page_number), MAX(page_number) FROM satsang")
            result = cursor.fetchone()
            min_page, max_page = result[0] or 0, result[1] or 0

            return {
                'success': True,
                'stats': {
                    'start_date': self.start_date.isoformat(),
                    'today_page': today_page,
                    'total_days_since_start': today_page,
                    'total_satsangs_in_db': total_in_db,
                    'coverage_percentage': round((total_in_db / today_page) * 100, 2) if today_page > 0 else 0,
                    'min_page_in_db': min_page,
                    'max_page_in_db': max_page,
                    'missing_satsangs': today_page - total_in_db
                }
            }
        except Exception as e:
            logger.error(f"Error getting satsang stats: {e}")
            return {'success': False, 'message': str(e)}
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def seed_continuous_satsang_data(self, num_days=100):
        """Seed database with continuous satsang data"""
        if not self.get_db_connection:
            logger.error("Database connection function not provided")
            return False

        connection = None
        cursor = None

        try:
            connection = self.get_db_connection()
            cursor = connection.cursor()

            for day in range(1, num_days + 1):
                page_date = self.start_date + timedelta(days=day - 1)
                marathi_date = self.get_marathi_date(page_date)
                english_date = page_date.strftime("%B %d, %Y")

                query = """
                    INSERT INTO satsang
                    (title, content, content_en, marathi_content, english_content,
                     author, page_number, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """

                values = (
                    f'दिवस {day} - सत्संग',
                    f'आज दिनांक {marathi_date} चा सत्संग...',
                    f'Today\'s satsang for {english_date}...',
                    f'विस्तृत मराठी सत्संग सामग्री दिवस {day}',
                    f'Detailed English satsang content for day {day}',
                    'सद्गुरू',
                    day,
                    page_date
                )

                cursor.execute(query, values)

            connection.commit()
            logger.info(f"Successfully seeded {num_days} satsang entries")
            return True

        except Exception as e:
            logger.error(f"Error seeding data: {e}")
            if connection:
                connection.rollback()
            return False
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

# ========== SATSANG ROUTES ==========

# Initialize SatsangManager
satsang_manager = SatsangManager(
    start_date=date(2025, 8, 17),
    db_connection_func=get_db_connection
)
@wisdom_bp.route('/knowledge/satsang')
def daily_satsang():
    """🕉️ Serve daily satsang page with proper content handling."""
    try:
        # 📢 Determine page number from query or today's date
        page_param = request.args.get('page')
        
        if page_param and page_param.isdigit():
            page_number = int(page_param)
            if page_number < 1:
                page_number = 1
        else:
            # Calculate today's page number
            start_date = date(2025, 8, 17)
            today = date.today()
            page_number = max(1, (today - start_date).days + 1)
        
        print(f"DEBUG: Requested page number: {page_number}")
        
        # 📖 Fetch satsang from database
        satsang = None
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(DictCursor)
            
            query = """
                SELECT id, page_number, title, content, content_en, 
                       marathi_content, english_content, author, 
                       date, created_at
                FROM satsang
                WHERE page_number = %s AND is_active = 1
                LIMIT 1
            """
            cursor.execute(query, (page_number,))
            satsang = cursor.fetchone()
            
            print(f"DEBUG: Raw database result: {satsang}")
            
            if satsang:
                # Handle the content fields with proper fallback logic
                
                # For Marathi content: use marathi_content first, then content
                marathi_content = (satsang.get('marathi_content') or 
                                 satsang.get('content') or 
                                 '')
                
                # For English content: use english_content first, then content_en
                english_content = (satsang.get('english_content') or 
                                 satsang.get('content_en') or 
                                 'English translation will be available soon.')
                
                # Clean up the satsang object
                satsang['marathi_content'] = marathi_content.strip()
                satsang['english_content'] = english_content.strip()
                satsang['title'] = satsang.get('title') or f'दिवस {page_number} - सत्संग'
                satsang['author'] = satsang.get('author') or 'सद्गुरू'
                
                print(f"DEBUG: Final marathi_content length: {len(satsang['marathi_content'])}")
                print(f"DEBUG: Final english_content length: {len(satsang['english_content'])}")
                print(f"DEBUG: Marathi preview: {satsang['marathi_content'][:100]}...")
            
        except Exception as db_error:
            print(f"Database error: {db_error}")
            satsang = None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
        
        # 🌸 Generate fallback satsang if none found
        if not satsang:
            print(f"DEBUG: Creating fallback satsang for page {page_number}")
            
            start_date = date(2025, 8, 17)
            page_date = start_date + timedelta(days=page_number - 1)
            today = date.today()
            
            if page_date > today:
                days_ahead = (page_date - today).days
                marathi_content = f'हा सत्संग आजपासून {days_ahead} दिवसानी उपलब्ध होईल. कृपया धैर्य धरा.'
                english_content = f'This satsang will be available in {days_ahead} days from today. Please be patient.'
            elif page_date < today:
                days_ago = (today - page_date).days
                marathi_content = f'हा सत्संग {days_ago} दिवसांपूर्वीचा आहे. सामग्री लवकरच उपलब्ध होईल.'
                english_content = f'This satsang is from {days_ago} days ago. Content will be available soon.'
            else:
                marathi_content = 'आजचा सत्संग अद्याप तयार नाही. कृपया काही वेळाने पुन्हा प्रयत्न करा.'
                english_content = 'Today\'s satsang is not yet ready. Please try again later.'
            
            satsang = {
                'id': 0,
                'page_number': page_number,
                'title': f'दिवस {page_number} - सत्संग',
                'marathi_content': marathi_content,
                'english_content': english_content,
                'author': 'सद्गुरू कृपा',
                'date': page_date,
                'is_fallback': True
            }
        else:
            satsang['is_fallback'] = False
        
        # 📅 Calculate context for template
        start_date = date(2025, 8, 17)
        page_date = start_date + timedelta(days=page_number - 1)
        today = date.today()
        today_page = max(1, (today - start_date).days + 1)
        
        # Marathi date formatting
        marathi_months = [
            'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
            'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
        ]
        marathi_days = ['सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार']
        
        marathi_date = f"{page_date.day} {marathi_months[page_date.month - 1]} {page_date.year}"
        marathi_day = marathi_days[page_date.weekday()]
        english_date = page_date.strftime("%B %d, %Y")
        english_day = page_date.strftime("%A")
        
        # Navigation
        prev_page = page_number - 1 if page_number > 1 else None
        next_page = page_number + 1 if page_number < today_page + 30 else None
        
        context = {
            'satsang': satsang,
            'page_number': page_number,
            'page_date': page_date,
            'today_page': today_page,
            'prev_page': prev_page,
            'next_page': next_page,
            'is_today': page_number == today_page,
            'is_future': page_number > today_page,
            'is_past': page_number < today_page,
            'marathi_date': marathi_date,
            'english_date': english_date,
            'marathi_day': marathi_day,
            'english_day': english_day,
        }
        
        print(f"DEBUG: Context prepared successfully")
        print(f"DEBUG: Template will receive marathi_content: {len(satsang.get('marathi_content', ''))} chars")
        print(f"DEBUG: Template will receive english_content: {len(satsang.get('english_content', ''))} chars")
        
        # 🎨 Render satsang page
        return render_template('knowledge/satsang.html', **context)
        
    except Exception as e:
        print(f"ERROR in daily_satsang: {e}")
        import traceback
        traceback.print_exc()
        return f"""
        <h1>🚨 Error in Satsang Route</h1>
        <p><strong>Error:</strong> {str(e)}</p>
        <pre>{traceback.format_exc()}</pre>
        <p><a href="/debug/satsang">🔍 Debug Satsang</a></p>
        """, 500

# Add a route to check what page number should be shown today
@wisdom_bp.route('/debug/page_calculation')
def debug_page_calculation():
    """Debug today's page calculation"""
    start_date = date(2025, 8, 17)
    today = date.today()
    days_diff = (today - start_date).days
    page_number = days_diff + 1
    
    return f"""
    <h2>📅 Page Calculation Debug</h2>
    <p><strong>Start Date:</strong> {start_date}</p>
    <p><strong>Today:</strong> {today}</p>
    <p><strong>Days Difference:</strong> {days_diff}</p>
    <p><strong>Page Number:</strong> {page_number}</p>
    <p><a href="/knowledge/satsang?page={page_number}">View Page {page_number}</a></p>
    <p><a href="/knowledge/satsang?page=5">View Page 5 (has data)</a></p>
    """

@wisdom_bp.route('/harijap')
def harijap():
    """
    🕉️ हरि जप साधना - Voice-based jap counter
    Accessible to all users without authentication
    """
    return render_template('harijap.html')
