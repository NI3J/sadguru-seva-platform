from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import date
import uuid
import pymysql

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
    """Return only English words ordered by word_order."""
    cursor.execute(
        "SELECT word_order, word_english FROM krasha_jap ORDER BY word_order"
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

        return render_template(
            'japa.html',
            mantra_words=mantra_words,
            current_count=current_count,
            current_word_index=current_word_index,
            daily_rounds=daily_rounds,
            daily_words=daily_words
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
        recognized_word = (data.get('word') or '').lower().strip()
        if not recognized_word or len(recognized_word) > 50:
            return jsonify({'success': False, 'error': 'Invalid word'}), 400

        user_token = get_or_create_user_token()
        conn = get_db_connection()
        cursor = get_cursor(conn)

        current_session = fetch_active_session(cursor, user_token)
        if not current_session:
            return jsonify({'success': False, 'error': 'No active session found'}), 409

        session_total_count = int(current_session['total_count'])
        current_word_index = int(current_session['current_word_index'])

        # Expected word (English only for match & UI)
        cursor.execute("""
            SELECT word_english FROM krasha_jap WHERE word_order = %s
        """, (current_word_index,))
        expected = cursor.fetchone()
        if not expected:
            return jsonify({'success': False, 'error': 'Word not found'}), 404
        expected_english = expected['word_english'].lower().strip()

        # Matching
        word_mappings = {
            'radhe': ['radhe', 'राधे', 'राधा', 'radha', 'ride', 'ready'],
            'krishna': ['krishna', 'कृष्णा', 'कृष्ण', 'krishn', 'krish', 'krishnan'],
            'naam': ['naam', 'नाम', 'nam', 'name']
        }
        is_match = recognized_word == expected_english or \
                   (expected_english in word_mappings and recognized_word in word_mappings[expected_english])

        if not is_match:
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {'word_english': expected_english},
                'recognized_word': recognized_word
            }), 200

        # Advance counters
        new_count = session_total_count + 1
        new_word_index = current_word_index + 1
        completed_round = False

        if new_word_index > 16:
            new_word_index = 1
            completed_round = True
            today = date.today()
            cursor.execute("""
                INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                VALUES (%s, %s, 1, 16)
                ON DUPLICATE KEY UPDATE
                    total_rounds = total_rounds + 1,
                    total_words = total_words + 16
            """, (user_token, today))

        cursor.execute("""
            UPDATE japa_sessions
            SET total_count = %s, current_word_index = %s, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (new_count, new_word_index, user_token))
        conn.commit()

        # Next word
        cursor.execute("""
            SELECT word_english FROM krasha_jap WHERE word_order = %s
        """, (new_word_index,))
        next_row = cursor.fetchone()
        next_word = {'word_english': next_row['word_english']} if next_row else None

        return jsonify({
            'success': True,
            'matched': True,
            'new_count': new_count,
            'current_word_index': new_word_index,
            'next_word': next_word,
            'completed_round': completed_round,
            'recognized_word': recognized_word,
            'expected_word': expected_english
        }), 200
    except Exception as e:
        print("Error updating japa count:", repr(e))
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
        stats = cursor.fetchone()

        daily_rounds = int(stats['total_rounds']) if stats else 0
        daily_words = int(stats['total_words']) if stats else 0

        # Optional: also fetch overall cumulative stats
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

