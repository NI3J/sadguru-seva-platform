# --- Imports & Blueprint ---
from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import date
import uuid, pymysql, difflib, re

japa_bp = Blueprint('japa', __name__)

# --- Mantra Pattern ---
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
    {'word': 'shyama', 'devanagari': 'शामा', 'repetitions': 1},
    {'word': 'radhe', 'devanagari': 'राधे', 'repetitions': 2}
]
TOTAL_UTTERANCES = sum(item['repetitions'] for item in MANTRA_PATTERN)

# --- Session & Pattern Helpers ---
def get_or_create_user_token():
    if session.get('authenticated') and session.get('user_id'):
        return session['user_id']
    token = session.get('japa_user_token')
    if token: return token
    token = str(uuid.uuid4())
    session['japa_user_token'] = token
    return token

def get_cursor(conn):
    return conn.cursor(pymysql.cursors.DictCursor)

def fetch_active_session(cursor, user_token):
    cursor.execute("""
        SELECT id, total_count, current_word_index AS current_pattern_position,
               COALESCE(current_repetition_count, 1) AS current_repetition_count
        FROM japa_sessions
        WHERE user_id = %s AND session_active = 1
        ORDER BY session_start DESC LIMIT 1
    """, (user_token,))
    return cursor.fetchone()

def get_pattern_info_from_position(position):
    position = max(1, min(position, len(MANTRA_PATTERN)))
    item = MANTRA_PATTERN[position - 1]
    return {
        'pattern_index': position - 1,
        'word_english': item['word'],
        'word_devanagari': item['devanagari'],
        'total_repetitions': item['repetitions'],
        'pattern_position': position
    }

def get_expected_word_from_session(pos, rep):
    info = get_pattern_info_from_position(pos)
    return {
        'word_english': info['word_english'],
        'word_devanagari': info['word_devanagari'],
        'repetition_number': rep,
        'total_repetitions': info['total_repetitions'],
        'pattern_position': pos,
        'pattern_index': info['pattern_index']
    }

def advance_position(pos, rep):
    info = get_pattern_info_from_position(pos)
    if rep < info['total_repetitions']:
        return pos, rep + 1, False
    new_pos = pos + 1
    return (1, 1, True) if new_pos > len(MANTRA_PATTERN) else (new_pos, 1, False)

def create_display_mantra():
    display = []
    word_order = 1
    for item in MANTRA_PATTERN:
        for rep in range(item['repetitions']):
            display.append({
                'word_order': word_order,
                'word_english': item['word'],
                'word_devanagari': item['devanagari'],
                'is_repetition': rep > 0,
                'repetition_number': rep + 1,
                'total_repetitions': item['repetitions']
            })
            word_order += 1
    return display

def normalize_word(word):
    word = re.sub(r'[^\w\s]', '', word.lower().strip())
    return re.sub(r'\s+', ' ', word).strip()

def is_word_match(recognized, expected):
    recognized = normalize_word(recognized)
    expected = normalize_word(expected)
    if recognized == expected: return True

    word_mappings = {
        'radhe': ['radhe', 'radi', 'radhi', 'rade', 'radhey', 'राधे', 'राधेय'],
        'krishna': ['krishna', 'krisna', 'krishnaa', 'कृष्णा', 'कृष्णाय'],
        'shyam': ['shyam', 'shaam', 'shym', 'श्याम', 'श्यामल'],
        'shyama': ['shyama', 'श्यामा']
    }

    if expected in word_mappings:
        for variation in word_mappings[expected]:
            if recognized == normalize_word(variation):
                return True

    for base, variations in word_mappings.items():
        if base == expected:
            for variation in variations:
                if recognized == normalize_word(variation):
                    return True

    if len(recognized) >= 3 and len(expected) >= 3:
        if difflib.SequenceMatcher(None, recognized, expected).ratio() >= 0.7:
            return True

    if len(expected) >= 4 and (recognized in expected or expected in recognized):
        return True

    return False
@japa_bp.route('/japa')
def japa_page():
    conn, cursor = None, None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)
        user_token = get_or_create_user_token()
        mantra_words = create_display_mantra()
        session_row = fetch_active_session(cursor, user_token)
        current_count = int(session_row['total_count']) if session_row else 0

        if session_row:
            pos = int(session_row['current_pattern_position'])
            rep = int(session_row['current_repetition_count'])
            current_word_index = sum(MANTRA_PATTERN[i]['repetitions'] for i in range(pos - 1)) + rep
        else:
            current_word_index = 1

        today = date.today()
        cursor.execute("""
            SELECT total_rounds, total_words FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (user_token, today))
        daily = cursor.fetchone()
        daily_rounds = int(daily['total_rounds']) if daily else 0
        daily_words = int(daily['total_words']) if daily else 0

        cursor.execute("""
            SELECT SUM(total_rounds) AS lifetime_rounds,
                   SUM(total_words) AS lifetime_words
            FROM japa_daily_counts WHERE user_id = %s
        """, (user_token,))
        lifetime = cursor.fetchone()
        lifetime_rounds = int(lifetime['lifetime_rounds'] or 0)
        lifetime_words = int(lifetime['lifetime_words'] or 0)

        return render_template('japa.html',
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
        return render_template('japa.html',
            mantra_words=[], current_count=0, current_word_index=1,
            daily_rounds=0, daily_words=0, lifetime_rounds=0, lifetime_words=0,
            error=str(e)
        )
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/start_session', methods=['POST'])
def start_japa_session():
    conn, cursor = None, None
    try:
        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)
        row = fetch_active_session(cursor, user_token)

        if row:
            pos = int(row['current_pattern_position'])
            rep = int(row['current_repetition_count'])
            word_index = sum(MANTRA_PATTERN[i]['repetitions'] for i in range(pos - 1)) + rep
            return jsonify({
                'success': True,
                'data': {
                    'total_count': int(row['total_count']),
                    'current_word_index': word_index,
                    'session_id': int(row['id'])
                }
            }), 200

        try:
            cursor.execute("ALTER TABLE japa_sessions ADD COLUMN current_repetition_count INT DEFAULT 1")
            conn.commit()
        except pymysql.Error as e:
            if "Duplicate column name" not in str(e):
                print("Warning: Could not add column:", e)

        cursor.execute("""
            INSERT INTO japa_sessions (user_id, session_start, total_count,
                current_word_index, current_repetition_count, session_active, last_updated)
            VALUES (%s, NOW(), %s, %s, %s, %s, NOW())
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
        print("Error starting session:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
@japa_bp.route('/api/japa/update_count', methods=['POST'])
def update_japa_count():
    conn, cursor = None, None
    try:
        data = request.get_json(silent=True) or {}
        word = (data.get('word') or '').strip()
        if not word or len(word) > 100:
            return jsonify({'success': False, 'error': 'Invalid word'}), 400

        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)
        session = fetch_active_session(cursor, user_token)
        if not session:
            return jsonify({'success': False, 'error': 'No active session'}), 409

        count = int(session['total_count'])
        pos = int(session['current_pattern_position'])
        rep = int(session['current_repetition_count'])

        expected = get_expected_word_from_session(pos, rep)
        match = is_word_match(word, expected['word_english'])

        if not match:
            score = difflib.SequenceMatcher(None,
                normalize_word(word), normalize_word(expected['word_english'])).ratio()
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {
                    'word_english': expected['word_english'],
                    'word_devanagari': expected['word_devanagari'],
                    'repetition_info': f"{expected['repetition_number']}/{expected['total_repetitions']}"
                },
                'recognized_word': word,
                'similarity_score': score
            }), 200

        new_count = count + 1
        new_pos, new_rep, completed = advance_position(pos, rep)

        if completed:
            today = date.today()
            cursor.execute("""
                INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                VALUES (%s, %s, 1, %s)
                ON DUPLICATE KEY UPDATE
                    total_rounds = total_rounds + 1,
                    total_words = total_words + %s
            """, (user_token, today, TOTAL_UTTERANCES, TOTAL_UTTERANCES))

        cursor.execute("""
            UPDATE japa_sessions
            SET total_count = %s, current_word_index = %s,
                current_repetition_count = %s, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (new_count, new_pos, new_rep, user_token))
        conn.commit()

        next_word = get_expected_word_from_session(new_pos, new_rep)
        word_index = sum(MANTRA_PATTERN[i]['repetitions'] for i in range(new_pos - 1)) + new_rep

        return jsonify({
            'success': True,
            'matched': True,
            'new_count': new_count,
            'current_word_index': word_index,
            'next_word': {
                'word_english': next_word['word_english'],
                'word_devanagari': next_word['word_devanagari'],
                'repetition_info': f"{next_word['repetition_number']}/{next_word['total_repetitions']}"
            },
            'completed_round': completed,
            'recognized_word': word,
            'expected_word': expected['word_english'],
            'total_words_in_mantra': TOTAL_UTTERANCES
        }), 200
    except Exception as e:
        print("Error updating count:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/end_session', methods=['POST'])
def end_japa_session():
    conn, cursor = None, None
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
        print("Error ending session:", repr(e))
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@japa_bp.route('/api/japa/get_stats', methods=['GET'])
def get_japa_stats():
    conn, cursor = None, None
    try:
        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)
        today = date.today()

        # Fetch today's stats
        cursor.execute("""
            SELECT total_rounds, total_words
            FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (user_token, today))
        daily = cursor.fetchone()
        daily_rounds = int(daily['total_rounds']) if daily else 0
        daily_words = int(daily['total_words']) if daily else 0

        # Fetch lifetime stats
        cursor.execute("""
            SELECT SUM(total_rounds) AS lifetime_rounds,
                   SUM(total_words) AS lifetime_words
            FROM japa_daily_counts
            WHERE user_id = %s
        """, (user_token,))
        lifetime = cursor.fetchone()
        lifetime_rounds = int(lifetime['lifetime_rounds']) if lifetime and lifetime['lifetime_rounds'] else 0
        lifetime_words = int(lifetime['lifetime_words']) if lifetime and lifetime['lifetime_words'] else 0

        # Return stats with pattern info
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
