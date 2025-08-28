from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import date
import uuid
import pymysql
import difflib
import re

japa_bp = Blueprint('japa', __name__)

# Define the mantra pattern with repetitions
MANTRA_PATTERN = [
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 1},
    {'word': 'krishna', 'devanagari': 'कृष्णा', 'repetitions': 1},
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 1},
    {'word': 'krishna', 'devanagari': 'कृष्णा', 'repetitions': 3},
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 3},
    {'word': 'shyam', 'devanagari': 'श्याम', 'repetitions': 1},
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 1},
    {'word': 'shyama', 'devanagari': 'श्यामा', 'repetitions': 1},
    {'word': 'shyam', 'devanagari': 'श्याम', 'repetitions': 1},
    {'word': 'shyama', 'devanagari': 'श्यामा', 'repetitions': 1},
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 2}
]

# Calculate total utterances in one complete round
TOTAL_UTTERANCES = sum(item['repetitions'] for item in MANTRA_PATTERN)

# Create utterance-based sequence for easier tracking
def create_utterance_sequence():
    """Create a flat sequence of utterances with their metadata."""
    utterances = []
    utterance_index = 1
    
    for pattern_index, pattern_item in enumerate(MANTRA_PATTERN):
        for rep in range(pattern_item['repetitions']):
            utterances.append({
                'utterance_index': utterance_index,
                'pattern_index': pattern_index,
                'word_english': pattern_item['word'],
                'word_devanagari': pattern_item['devanagari'],
                'repetition_number': rep + 1,
                'total_repetitions': pattern_item['repetitions'],
                'is_repetition': rep > 0
            })
            utterance_index += 1
    
    return utterances

# Global utterance sequence
UTTERANCE_SEQUENCE = create_utterance_sequence()

# ---------- Helpers ----------
def get_or_create_user_token() -> str:
    """Get authenticated user_id or redirect to auth if not authenticated."""
    # Check if user is authenticated via the auth system
    if session.get('authenticated') and session.get('user_id'):
        return session.get('user_id')

    # For backwards compatibility, check old japa_user_token
    token = session.get('japa_user_token')
    if token and isinstance(token, str) and token.strip():
        return token

    # If no authentication, create a temporary token (for testing)
    # In production, you should redirect to /auth instead
    token = str(uuid.uuid4())
    session['japa_user_token'] = token
    return token

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def get_utterance_info(utterance_index):
    """Get utterance information by index (1-16)."""
    if utterance_index < 1:
        utterance_index = 1
    elif utterance_index > TOTAL_UTTERANCES:
        utterance_index = 1  # Reset to beginning
    
    return UTTERANCE_SEQUENCE[utterance_index - 1]

def create_display_mantra():
    """Create the mantra display with repetitions shown."""
    display_words = []
    
    for utterance in UTTERANCE_SEQUENCE:
        display_words.append({
            'word_order': utterance['utterance_index'],
            'word_english': utterance['word_english'],
            'word_devanagari': utterance['word_devanagari'],
            'is_repetition': utterance['is_repetition'],
            'repetition_number': utterance['repetition_number'],
            'total_repetitions': utterance['total_repetitions']
        })
    
    return display_words

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
            'radhe', 'राधे', 'राधे', 'radhe', 'radhe', 'ready', 'radi', 'radhi',
            'rade', 'radey', 'radhai', 'radhey', 'राधे', 'राधेय'
        ],
        'krishna': [
            'krishna', 'कृष्णा', 'कृष्णा', 'krishna', 'krisha', 'krishnana', 'krisna',
            'krishnaa', 'krishnaha', 'krsna', 'कृष्णाय', 'कृष्णा', 'कृष्णा'
        ],
        'shyam': [
            'shyam', 'श्याम', 'sham', 'shaam', 'shyam', 'श्याम', 'syam',
            'shyam', 'shyamah', 'श्यामाय', 'shyamal', 'श्यामल', 'shym'
        ],
        'shyama': [
            'shyama', 'श्यामा', 'shyama', 'shyama', 'shyama', 'श्यामा', 'shyama',
            'shyama', 'shyama', 'श्यामा', 'shyama', 'श्यामा'
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

        # Use our utterance-based mantra words
        mantra_words = create_display_mantra()

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
        current_utterance_index = int(current_session['current_word_index'])

        # Get expected word using utterance index
        expected_utterance = get_utterance_info(current_utterance_index)
        expected_english = expected_utterance['word_english']
        expected_devanagari = expected_utterance['word_devanagari']

        # Enhanced matching
        is_match = is_word_match(recognized_word, expected_english)

        if not is_match:
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {
                    'word_english': expected_english,
                    'word_devanagari': expected_devanagari,
                    'repetition_info': f"{expected_utterance['repetition_number']}/{expected_utterance['total_repetitions']}"
                },
                'recognized_word': recognized_word,
                'similarity_score': difflib.SequenceMatcher(None,
                    normalize_word(recognized_word),
                    normalize_word(expected_english)
                ).ratio()
            }), 200

        # Advance to next utterance
        new_count = session_total_count + 1
        new_utterance_index = current_utterance_index + 1
        completed_round = False

        if new_utterance_index > TOTAL_UTTERANCES:
            # Completed full round
            new_utterance_index = 1
            completed_round = True
            
            # Update daily stats
            today = date.today()
            cursor.execute("""
                INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                VALUES (%s, %s, 1, %s)
                ON DUPLICATE KEY UPDATE
                    total_rounds = total_rounds + 1,
                    total_words = total_words + %s
            """, (user_token, today, TOTAL_UTTERANCES, TOTAL_UTTERANCES))

        # Update session
        cursor.execute("""
            UPDATE japa_sessions
            SET total_count = %s, current_word_index = %s, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (new_count, new_utterance_index, user_token))
        conn.commit()

        # Get next word info
        next_utterance = get_utterance_info(new_utterance_index)

        return jsonify({
            'success': True,
            'matched': True,
            'new_count': new_count,
            'current_word_index': new_utterance_index,
            'next_word': {
                'word_english': next_utterance['word_english'],
                'word_devanagari': next_utterance['word_devanagari'],
                'repetition_info': f"{next_utterance['repetition_number']}/{next_utterance['total_repetitions']}"
            },
            'completed_round': completed_round,
            'recognized_word': recognized_word,
            'expected_word': expected_english,
            'total_words_in_mantra': TOTAL_UTTERANCES
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
                },
                'pattern_info': {
                    'total_utterances': TOTAL_UTTERANCES,
                    'pattern_length': len(MANTRA_PATTERN)
                }
            }
        }), 200
    except Exception as e:
        print("Error getting japa stats:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# New API endpoint to get pattern information
@japa_bp.route('/api/japa/get_pattern', methods=['GET'])
def get_mantra_pattern():
    """Return the complete mantra pattern with repetition information."""
    return jsonify({
        'success': True,
        'data': {
            'pattern': MANTRA_PATTERN,
            'total_utterances': TOTAL_UTTERANCES,
            'display_words': create_display_mantra(),
            'utterance_sequence': UTTERANCE_SEQUENCE
        }
    }), 200
