from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import date
import uuid
import pymysql
import difflib
import re

japa_bp = Blueprint('japa', __name__)

# ---------- Helpers ----------
def get_or_create_user_token() -> str:
    """Stable per-browser UUID stored in Flask session."""
    token = session.get('japa_user_token')
    if not token or not isinstance(token, str) or not token.strip():
        token = str(uuid.uuid4())
        session['japa_user_token'] = token
    return token

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def fetch_mantra_words(cursor):
    """Return both Devanagari and English words ordered by word_order."""
    cursor.execute(
        "SELECT word_order, word_devanagari, word_english FROM krasha_jap ORDER BY word_order"
    )
    return cursor.fetchall() or []

def fetch_active_session(cursor, user_token):
    """Return dict with id, total_count, current_word_index or None."""
    cursor.execute("""
        SELECT id, total_count, current_word_index
        FROM japa_sessions
        WHERE user_id = %s AND session_active = 1
        ORDER BY session_start DESC LIMIT 1
    """, (user_token,))
    return cursor.fetchone()

def normalize_word(word):
    """Normalize word for better matching."""
    if not word:
        return ""
    
    # Convert to lowercase and strip
    word = word.lower().strip()
    
    # Remove punctuation and extra spaces
    word = re.sub(r'[^\w\s]', '', word)
    word = re.sub(r'\s+', ' ', word).strip()
    
    return word

def is_word_match(recognized_word, expected_word):
    """Enhanced word matching with fuzzy logic and multiple variations."""
    recognized = normalize_word(recognized_word)
    expected = normalize_word(expected_word)
    
    # Direct match
    if recognized == expected:
        return True
    
    # Enhanced word mappings with more variations
    word_mappings = {
        'radhe': [
            'radhe', 'राधे', 'राधा', 'radha', 'ride', 'ready', 'radi', 'radhi',
            'rade', 'radey', 'radhai', 'radhey', 'राध', 'राधेय'
        ],
        'krishna': [
            'krishna', 'कृष्णा', 'कृष्ण', 'krishn', 'krish', 'krishnan', 'krisna',
            'krishnaa', 'krishnah', 'krsna', 'कृष्णाय', 'कृष्णः', 'कृषण'
        ],
        'shyam': [
            'shyam', 'श्याम', 'sham', 'shaam', 'shyama', 'श्यामा', 'syam',
            'shyamaa', 'shyamah', 'श्यामाय', 'shyamal', 'श्यामल', 'shym'
        ],
        'shama': [
            'shama', 'शामा', 'sham', 'shaam', 'shyama', 'श्यामा', 'sama',
            'shamaa', 'shamah', 'शामाय', 'shyam', 'श्याम'
        ]
    }
    
    # Check if recognized word matches any variation of expected word
    if expected in word_mappings:
        for variation in word_mappings[expected]:
            if recognized == normalize_word(variation):
                return True
    
    # Check reverse mapping (if recognized word is a variation of expected)
    for base_word, variations in word_mappings.items():
        if base_word == expected:
            for variation in variations:
                if recognized == normalize_word(variation):
                    return True
    
    # Fuzzy matching for close pronunciations
    similarity_threshold = 0.7
    if len(recognized) >= 3 and len(expected) >= 3:
        similarity = difflib.SequenceMatcher(None, recognized, expected).ratio()
        if similarity >= similarity_threshold:
            return True
    
    # Check for partial matches (useful for longer words)
    if len(expected) >= 4:
        if recognized in expected or expected in recognized:
            min_length = min(len(recognized), len(expected))
            if min_length >= 3:
                return True
    
    return False

# ---------- Routes ----------
@japa_bp.route('/japa')
def japa_page():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)

        user_token = get_or_create_user_token()
        mantra_words = fetch_mantra_words(cursor)

        # Current session stats
        session_row = fetch_active_session(cursor, user_token)
        current_count = int(session_row['total_count']) if session_row else 0
        current_word_index = int(session_row['current_word_index']) if session_row else 1

        # Daily stats
        today = date.today()
        cursor.execute("""
            SELECT total_rounds, total_words
            FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (user_token, today))
        daily = cursor.fetchone()
        daily_rounds = int(daily['total_rounds']) if daily else 0
        daily_words = int(daily['total_words']) if daily else 0

        # Lifetime stats
        cursor.execute("""
            SELECT SUM(total_rounds) AS lifetime_rounds,
                   SUM(total_words) AS lifetime_words
            FROM japa_daily_counts
            WHERE user_id = %s
        """, (user_token,))
        lifetime = cursor.fetchone()
        lifetime_rounds = int(lifetime['lifetime_rounds']) if lifetime and lifetime['lifetime_rounds'] else 0
        lifetime_words = int(lifetime['lifetime_words']) if lifetime and lifetime['lifetime_words'] else 0

        return render_template(
            'japa.html',
            mantra_words=mantra_words,
            current_count=current_count,
            current_word_index=current_word_index,
            daily_rounds=daily_rounds,
            daily_words=daily_words,
            lifetime_rounds=lifetime_rounds,
            lifetime_words=lifetime_words
        )
    except Exception as e:
        print("Error in japa_page:", repr(e))
        return render_template(
            'japa.html',
            mantra_words=[],
            current_count=0,
            current_word_index=1,
            daily_rounds=0,
            daily_words=0,
            lifetime_rounds=0,
            lifetime_words=0,
            error=str(e)
        )
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/start_session', methods=['POST'])
def start_japa_session():
    conn = None
    cursor = None
    try:
        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)

        row = fetch_active_session(cursor, user_token)
        if row:
            return jsonify({
                'success': True,
                'data': {
                    'total_count': int(row['total_count']),
                    'current_word_index': int(row['current_word_index']),
                    'session_id': int(row['id'])
                }
            }), 200

        cursor.execute("""
            INSERT INTO japa_sessions
                (user_id, session_start, total_count, current_word_index, session_active, last_updated)
            VALUES
                (%s, NOW(), %s, %s, %s, NOW())
        """, (user_token, 0, 1, 1))
        conn.commit()
        return jsonify({
            'success': True,
            'data': {
                'total_count': 0,
                'current_word_index': 1,
                'session_id': cursor.lastrowid
            }
        }), 201
    except Exception as e:
        print("Error starting japa session:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/update_count', methods=['POST'])
def update_japa_count():
    conn = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}
        recognized_word = (data.get('word') or '').strip()
        if not recognized_word or len(recognized_word) > 100:
            return jsonify({'success': False, 'error': 'Invalid word'}), 400

        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)

        current_session = fetch_active_session(cursor, user_token)
        if not current_session:
            return jsonify({'success': False, 'error': 'No active session found'}), 409

        session_total_count = int(current_session['total_count'])
        current_word_index = int(current_session['current_word_index'])

        # Get expected word (both Devanagari and English)
        cursor.execute("""
            SELECT word_devanagari, word_english FROM krasha_jap WHERE word_order = %s
        """, (current_word_index,))
        expected = cursor.fetchone()
        if not expected:
            return jsonify({'success': False, 'error': 'Word not found'}), 404
        
        expected_english = expected['word_english']
        expected_devanagari = expected['word_devanagari']

        # Enhanced matching
        is_match = is_word_match(recognized_word, expected_english)

        if not is_match:
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {
                    'word_english': expected_english,
                    'word_devanagari': expected_devanagari
                },
                'recognized_word': recognized_word,
                'similarity_score': difflib.SequenceMatcher(None, 
                    normalize_word(recognized_word), 
                    normalize_word(expected_english)
                ).ratio()
            }), 200

        # Advance counters
        new_count = session_total_count + 1
        new_word_index = current_word_index + 1
        completed_round = False

        # Check if we completed 16 words (assuming full mantra cycle)
        cursor.execute("SELECT COUNT(*) as total FROM krasha_jap")
        total_words_result = cursor.fetchone()
        total_words_in_mantra = total_words_result['total'] if total_words_result else 16

        if new_word_index > total_words_in_mantra:
            new_word_index = 1
            completed_round = True
            today = date.today()
            cursor.execute("""
                INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                VALUES (%s, %s, 1, %s)
                ON DUPLICATE KEY UPDATE
                    total_rounds = total_rounds + 1,
                    total_words = total_words + %s
            """, (user_token, today, total_words_in_mantra, total_words_in_mantra))

        cursor.execute("""
            UPDATE japa_sessions
            SET total_count = %s, current_word_index = %s, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (new_count, new_word_index, user_token))
        conn.commit()

        # Get next word
        cursor.execute("""
            SELECT word_devanagari, word_english FROM krasha_jap WHERE word_order = %s
        """, (new_word_index,))
        next_row = cursor.fetchone()
        next_word = next_row if next_row else None

        return jsonify({
            'success': True,
            'matched': True,
            'new_count': new_count,
            'current_word_index': new_word_index,
            'next_word': next_word,
            'completed_round': completed_round,
            'recognized_word': recognized_word,
            'expected_word': expected_english,
            'total_words_in_mantra': total_words_in_mantra
        }), 200
    except Exception as e:
        print("Error updating japa count:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/end_session', methods=['POST'])
def end_japa_session():
    conn = None
    cursor = None
    try:
        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)

        cursor.execute("""
            UPDATE japa_sessions
            SET session_active = 0, session_end = NOW(), last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (user_token,))
        conn.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        print("Error ending japa session:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/get_stats', methods=['GET'])
def get_japa_stats():
    conn = None
    cursor = None
    try:
        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)

        today = date.today()
        cursor.execute("""
            SELECT total_rounds, total_words
            FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (user_token, today))
        daily_stats = cursor.fetchone()

        daily_rounds = int(daily_stats['total_rounds']) if daily_stats else 0
        daily_words = int(daily_stats['total_words']) if daily_stats else 0

        # Lifetime stats
        cursor.execute("""
            SELECT SUM(total_rounds) AS lifetime_rounds,
                   SUM(total_words) AS lifetime_words
            FROM japa_daily_counts
            WHERE user_id = %s
        """, (user_token,))
        lifetime = cursor.fetchone()
        lifetime_rounds = int(lifetime['lifetime_rounds']) if lifetime and lifetime['lifetime_rounds'] else 0
        lifetime_words = int(lifetime['lifetime_words']) if lifetime and lifetime['lifetime_words'] else 0

        return jsonify({
            'success': True,
            'data': {
                'today': {
                    'rounds': daily_rounds,
                    'words': daily_words
                },
                'lifetime': {
                    'rounds': lifetime_rounds,
                    'words': lifetime_words
                }
            }
        }), 200
    except Exception as e:
        print("Error getting japa stats:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
