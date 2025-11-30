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

def get_pattern_info_from_position(position):
    """Get pattern information based on position - now tracks pattern groups, not individual utterances."""
    if position < 1:
        position = 1
    elif position > len(MANTRA_PATTERN):
        position = 1  # Reset to beginning

    pattern_index = position - 1
    pattern_item = MANTRA_PATTERN[pattern_index]

    return {
        'pattern_index': pattern_index,
        'word_english': pattern_item['word'],
        'word_devanagari': pattern_item['devanagari'],
        'total_repetitions': pattern_item['repetitions'],
        'pattern_position': position
    }

def get_expected_word_from_session(current_pattern_position, current_repetition_count):
    """Get expected word details based on current pattern position and repetition count."""
    pattern_info = get_pattern_info_from_position(current_pattern_position)

    return {
        'word_english': pattern_info['word_english'],
        'word_devanagari': pattern_info['word_devanagari'],
        'repetition_number': current_repetition_count,
        'total_repetitions': pattern_info['total_repetitions'],
        'pattern_position': current_pattern_position,
        'pattern_index': pattern_info['pattern_index']
    }

def advance_position(current_pattern_position, current_repetition_count):
    """Advance to next position in pattern. Returns (new_pattern_position, new_repetition_count, completed_round)."""
    pattern_info = get_pattern_info_from_position(current_pattern_position)
    
    # FIXED: Only advance if ALL repetitions are completed
    if current_repetition_count < pattern_info['total_repetitions']:
        # Still need more repetitions of current word - stay on same word
        return current_pattern_position, current_repetition_count + 1, False
    else:
        # Completed all repetitions, move to next word in pattern
        new_pattern_position = current_pattern_position + 1
        if new_pattern_position > len(MANTRA_PATTERN):
            # Completed full round
            return 1, 1, True
        else:
            return new_pattern_position, 1, False

def create_display_mantra():
    """Create the mantra display with repetitions shown."""
    display_words = []
    word_order = 1

    for pattern_item in MANTRA_PATTERN:
        for rep in range(pattern_item['repetitions']):
            display_words.append({
                'word_order': word_order,
                'word_english': pattern_item['word'],
                'word_devanagari': pattern_item['devanagari'],
                'is_repetition': rep > 0,
                'repetition_number': rep + 1,
                'total_repetitions': pattern_item['repetitions']
            })
            word_order += 1

    return display_words

def fetch_active_session(cursor, user_token):
    """Return dict with id, total_count, current_pattern_position, current_repetition_count or None."""
    cursor.execute("""
        SELECT id, total_count, current_word_index as current_pattern_position,
               COALESCE(current_repetition_count, 1) as current_repetition_count
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
    """Enhanced word matching with strict separation between different words."""
    recognized = normalize_word(recognized_word)
    expected = normalize_word(expected_word)

    # Direct match
    if recognized == expected:
        return True

    # STRICT word mappings - each word has completely distinct variations
    word_mappings = {
        'radhe': [
            'radhe', 'राधे', 'radhey', 'radhai', 'rade', 'radey'
        ],
        'krishna': [
            'krishna', 'कृष्णा', 'krisha', 'krisna', 'krishnaa', 'krsna'
        ],
        'shyam': [
            'shyam', 'श्याम', 'sham', 'shaam', 'syam', 'shym'
            # NO variations that could match shyama
        ],
        'shyama': [
            'shyama', 'श्यामा', 'shyamaa'
            # NO variations that could match shyam
        ]
    }

    # STRICT CHECK: Only allow exact variations for expected word
    if expected in word_mappings:
        for variation in word_mappings[expected]:
            if recognized == normalize_word(variation):
                return True

    # DISABLED fuzzy matching between shyam and shyama completely
    if len(recognized) >= 4 and len(expected) >= 4:
        # STRICT prevention: Never allow shyam/shyama cross-match
        if (expected == 'shyam' and 'shyama' in recognized) or \
           (expected == 'shyama' and 'shyam' in recognized):
            return False
        
        # Additional strict checks for other similar words
        if (expected == 'radhe' and 'krishna' in recognized) or \
           (expected == 'krishna' and 'radhe' in recognized):
            return False
        
        # Only very high similarity for non-conflicting words
        similarity = difflib.SequenceMatcher(None, recognized, expected).ratio()
        if similarity >= 0.90:  # Very high threshold
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

        # Use our pattern-based mantra words
        mantra_words = create_display_mantra()

        # Current session stats
        session_row = fetch_active_session(cursor, user_token)
        current_count = int(session_row['total_count']) if session_row else 0

        # For display purposes, calculate word index from pattern position and repetition
        if session_row:
            current_pattern_position = int(session_row['current_pattern_position'])
            current_repetition_count = int(session_row['current_repetition_count'])

            # Calculate display word index (for the visual progress)
            current_word_index = 0
            for i in range(current_pattern_position - 1):
                current_word_index += MANTRA_PATTERN[i]['repetitions']
            current_word_index += current_repetition_count
        else:
            current_word_index = 1

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
            # Calculate display word index for existing session
            current_pattern_position = int(row['current_pattern_position'])
            current_repetition_count = int(row['current_repetition_count'])

            current_word_index = 0
            for i in range(current_pattern_position - 1):
                current_word_index += MANTRA_PATTERN[i]['repetitions']
            current_word_index += current_repetition_count

            return jsonify({
                'success': True,
                'data': {
                    'total_count': int(row['total_count']),
                    'current_word_index': current_word_index,
                    'session_id': int(row['id'])
                }
            }), 200

        # Add the new column if it doesn't exist
        try:
            cursor.execute("""
                ALTER TABLE japa_sessions
                ADD COLUMN current_repetition_count INT DEFAULT 1
            """)
            conn.commit()
        except pymysql.Error as e:
            # Column might already exist, that's fine
            if "Duplicate column name" not in str(e):
                print("Warning: Could not add current_repetition_count column:", e)

        cursor.execute("""
            INSERT INTO japa_sessions
                (user_id, session_start, total_count, current_word_index, current_repetition_count, session_active, last_updated)
            VALUES
                (%s, NOW(), %s, %s, %s, %s, NOW())
        """, (user_token, 0, 1, 1, 1))
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
        current_pattern_position = int(current_session['current_pattern_position'])
        current_repetition_count = int(current_session['current_repetition_count'])

        # Get expected word using our new pattern logic
        expected_word_data = get_expected_word_from_session(current_pattern_position, current_repetition_count)
        expected_english = expected_word_data['word_english']
        expected_devanagari = expected_word_data['word_devanagari']

        # Enhanced matching
        is_match = is_word_match(recognized_word, expected_english)

        if not is_match:
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {
                    'word_english': expected_english,
                    'word_devanagari': expected_devanagari,
                    'repetition_info': f"{expected_word_data['repetition_number']}/{expected_word_data['total_repetitions']}"
                },
                'recognized_word': recognized_word,
                'similarity_score': difflib.SequenceMatcher(None,
                    normalize_word(recognized_word),
                    normalize_word(expected_english)
                ).ratio()
            }), 200

        # FIXED: Advance counters using corrected logic
        new_count = session_total_count + 1
        new_pattern_position, new_repetition_count, completed_round = advance_position(
            current_pattern_position, current_repetition_count
        )

        # If completed full cycle, update daily stats
        if completed_round:
            today = date.today()
            cursor.execute("""
                INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                VALUES (%s, %s, 1, %s)
                ON DUPLICATE KEY UPDATE
                    total_rounds = total_rounds + 1,
                    total_words = total_words + %s
            """, (user_token, today, TOTAL_UTTERANCES, TOTAL_UTTERANCES))

        # Update session with new position and repetition count
        cursor.execute("""
            UPDATE japa_sessions
            SET total_count = %s, current_word_index = %s, current_repetition_count = %s, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (new_count, new_pattern_position, new_repetition_count, user_token))
        conn.commit()

        # Get next word info
        next_word_data = get_expected_word_from_session(new_pattern_position, new_repetition_count)

        # Calculate display word index for frontend
        current_word_index = 0
        for i in range(new_pattern_position - 1):
            current_word_index += MANTRA_PATTERN[i]['repetitions']
        current_word_index += new_repetition_count

        return jsonify({
            'success': True,
            'matched': True,
            'new_count': new_count,
            'current_word_index': current_word_index,
            'next_word': {
                'word_english': next_word_data['word_english'],
                'word_devanagari': next_word_data['word_devanagari'],
                'repetition_info': f"{next_word_data['repetition_number']}/{next_word_data['total_repetitions']}"
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
            'display_words': create_display_mantra()
        }
    }), 200
