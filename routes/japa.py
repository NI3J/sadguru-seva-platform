from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import datetime, date
import uuid

japa_bp = Blueprint('japa', __name__)

@japa_bp.route('/japa')
def japa_page():
    """Main japa page"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get mantra words from database (using pymysql compatible syntax)
        cursor.execute("SELECT word_order, word_devanagari, word_english FROM krasha_jap ORDER BY word_order")
        mantra_rows = cursor.fetchall()

        # Convert to list of dictionaries manually since pymysql doesn't support dictionary=True by default
        mantra_words = []
        if mantra_rows:
            columns = [desc[0] for desc in cursor.description]
            for row in mantra_rows:
                mantra_words.append(dict(zip(columns, row)))

        # Get or create session ID for user
        if 'japa_session_id' not in session:
            session['japa_session_id'] = str(uuid.uuid4())

        # Get current session stats if any
        session_id = session['japa_session_id']
        cursor.execute("""
            SELECT total_count, current_word_index FROM japa_sessions
            WHERE user_id = %s AND session_active = TRUE
            ORDER BY session_start DESC LIMIT 1
        """, (session_id,))

        session_result = cursor.fetchone()
        current_count = 0
        current_word_index = 1

        if session_result:
            current_count = session_result[0] if session_result[0] else 0
            current_word_index = session_result[1] if session_result[1] else 1

        # Get daily stats
        today = date.today()
        cursor.execute("""
            SELECT total_rounds, total_words FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (session_id, today))

        daily_result = cursor.fetchone()
        daily_rounds = 0
        daily_words = 0

        if daily_result:
            daily_rounds = daily_result[0] if daily_result[0] else 0
            daily_words = daily_result[1] if daily_result[1] else 0

        cursor.close()
        conn.close()

        return render_template('japa.html',
                             mantra_words=mantra_words,
                             current_count=current_count,
                             current_word_index=current_word_index,
                             daily_rounds=daily_rounds,
                             daily_words=daily_words)

    except Exception as e:
        print(f"Error in japa_page: {e}")
        return render_template('japa.html',
                             mantra_words=[],
                             current_count=0,
                             current_word_index=1,
                             daily_rounds=0,
                             daily_words=0,
                             error=str(e))

@japa_bp.route('/api/japa/start_session', methods=['POST'])
def start_japa_session():
    """Start or resume a japa session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        session_id = session.get('japa_session_id', str(uuid.uuid4()))
        session['japa_session_id'] = session_id

        # Check if there's an active session first
        cursor.execute("""
            SELECT id, total_count, current_word_index FROM japa_sessions
            WHERE user_id = %s AND session_active = 1
            ORDER BY session_start DESC LIMIT 1
        """, (session_id,))

        active_session = cursor.fetchone()

        if not active_session:
            try:
                # Create new session with explicit column specification
                cursor.execute("""
                    INSERT INTO japa_sessions (user_id, session_start, total_count, current_word_index, session_active, last_updated)
                    VALUES (%s, NOW(), %s, %s, %s, NOW())
                """, (session_id, 0, 1, 1))
                conn.commit()

                response_data = {
                    'total_count': 0,
                    'current_word_index': 1,
                    'session_id': session_id
                }
            except Exception as insert_error:
                print(f"Insert error: {insert_error}")
                # Try to handle existing session case
                cursor.execute("""
                    UPDATE japa_sessions 
                    SET session_active = 1, last_updated = NOW()
                    WHERE user_id = %s 
                    ORDER BY session_start DESC LIMIT 1
                """, (session_id,))
                conn.commit()
                
                response_data = {
                    'total_count': 0,
                    'current_word_index': 1,
                    'session_id': session_id
                }
        else:
            response_data = {
                'total_count': active_session[1] if active_session[1] else 0,
                'current_word_index': active_session[2] if active_session[2] else 1,
                'session_id': session_id
            }

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'data': response_data})

    except Exception as e:
        print(f"Error starting japa session: {e}")
        return jsonify({'success': False, 'error': str(e)})

@japa_bp.route('/api/japa/update_count', methods=['POST'])
def update_japa_count():
    """Update japa count when word is recognized"""
    try:
        data = request.json
        recognized_word = data.get('word', '').lower().strip()

        # Additional cleaning and validation
        if not recognized_word or len(recognized_word) > 50:
            return jsonify({'success': False, 'error': 'Invalid word'})

        conn = get_db_connection()
        cursor = conn.cursor()

        session_id = session.get('japa_session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No active session'})

        # Get current session
        cursor.execute("""
            SELECT id, total_count, current_word_index FROM japa_sessions
            WHERE user_id = %s AND session_active = 1
            ORDER BY session_start DESC LIMIT 1
        """, (session_id,))

        current_session = cursor.fetchone()
        if not current_session:
            return jsonify({'success': False, 'error': 'No active session found'})

        session_total_count = current_session[1] if current_session[1] else 0
        current_word_index = current_session[2] if current_session[2] else 1

        # Get expected word
        cursor.execute("""
            SELECT word_devanagari, word_english FROM krasha_jap
            WHERE word_order = %s
        """, (current_word_index,))

        expected_word_row = cursor.fetchone()
        if not expected_word_row:
            return jsonify({'success': False, 'error': 'Word not found'})

        expected_devanagari = expected_word_row[0]
        expected_english = expected_word_row[1].lower().strip()

        # Simple and strict word matching
        word_mappings = {
            'radhe': ['radhe', 'राधे', 'राधा', 'radha', 'ride', 'ready'],
            'krishna': ['krishna', 'कृष्णा', 'कृष्ण', 'krishn', 'krish', 'krishnan'],
            'naam': ['naam', 'नाम', 'nam', 'name']
        }

        is_match = False
        print(f"Checking word: '{recognized_word}' against expected: '{expected_english}'")

        # Check direct match first
        if recognized_word == expected_english:
            is_match = True
        # Check if recognized word matches any variation of expected word
        elif expected_english in word_mappings:
            is_match = recognized_word in word_mappings[expected_english]
            print(f"Checking variations: {word_mappings[expected_english]}, Match: {is_match}")

        print(f"Final match result: {is_match}")

        if is_match:
            new_count = session_total_count + 1
            new_word_index = current_word_index + 1

            # If we completed 16 words, reset to 1 and update daily count
            completed_round = False
            if new_word_index > 16:
                new_word_index = 1
                completed_round = True

                # Update daily count
                today = date.today()
                try:
                    cursor.execute("""
                        INSERT INTO japa_daily_counts (user_id, japa_date, total_rounds, total_words)
                        VALUES (%s, %s, 1, 16)
                        ON DUPLICATE KEY UPDATE
                        total_rounds = total_rounds + 1,
                        total_words = total_words + 16
                    """, (session_id, today))
                except Exception as daily_error:
                    print(f"Daily count update error: {daily_error}")
                    # Continue even if daily count fails

            # Update session
            cursor.execute("""
                UPDATE japa_sessions
                SET total_count = %s, current_word_index = %s, last_updated = NOW()
                WHERE user_id = %s AND session_active = 1
            """, (new_count, new_word_index, session_id))

            conn.commit()

            # Get next word
            cursor.execute("""
                SELECT word_devanagari, word_english FROM krasha_jap
                WHERE word_order = %s
            """, (new_word_index,))
            next_word_row = cursor.fetchone()

            next_word = None
            if next_word_row:
                next_word = {
                    'word_devanagari': next_word_row[0],
                    'word_english': next_word_row[1]
                }

            cursor.close()
            conn.close()

            return jsonify({
                'success': True,
                'matched': True,
                'new_count': new_count,
                'current_word_index': new_word_index,
                'next_word': next_word,
                'completed_round': completed_round,
                'recognized_word': recognized_word,
                'expected_word': expected_english
            })
        else:
            cursor.close()
            conn.close()
            return jsonify({
                'success': True,
                'matched': False,
                'expected_word': {'word_devanagari': expected_devanagari, 'word_english': expected_english},
                'recognized_word': recognized_word
            })

    except Exception as e:
        print(f"Error updating japa count: {e}")
        return jsonify({'success': False, 'error': str(e)})

@japa_bp.route('/api/japa/get_stats', methods=['GET'])
def get_japa_stats():
    """Get japa statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        session_id = session.get('japa_session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No session found'})

        today = date.today()

        # Get today's stats
        cursor.execute("""
            SELECT total_rounds, total_words FROM japa_daily_counts
            WHERE user_id = %s AND japa_date = %s
        """, (session_id, today))

        daily_stats_row = cursor.fetchone()
        daily_rounds = 0
        daily_words = 0

        if daily_stats_row:
            daily_rounds = daily_stats_row[0] if daily_stats_row[0] else 0
            daily_words = daily_stats_row[1] if daily_stats_row[1] else 0

        # Get current session stats
        cursor.execute("""
            SELECT total_count, current_word_index FROM japa_sessions
            WHERE user_id = %s AND session_active = 1
            ORDER BY session_start DESC LIMIT 1
        """, (session_id,))

        session_stats_row = cursor.fetchone()
        session_count = 0
        current_word_index = 1

        if session_stats_row:
            session_count = session_stats_row[0] if session_stats_row[0] else 0
            current_word_index = session_stats_row[1] if session_stats_row[1] else 1

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'daily_rounds': daily_rounds,
            'daily_words': daily_words,
            'session_count': session_count,
            'current_word_index': current_word_index
        })

    except Exception as e:
        print(f"Error getting japa stats: {e}")
        return jsonify({'success': False, 'error': str(e)})

@japa_bp.route('/api/japa/end_session', methods=['POST'])
def end_japa_session():
    """End current japa session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        session_id = session.get('japa_session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'No session found'})

        cursor.execute("""
            UPDATE japa_sessions
            SET session_active = 0, last_updated = NOW()
            WHERE user_id = %s AND session_active = 1
        """, (session_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True})

    except Exception as e:
        print(f"Error ending japa session: {e}")
        return jsonify({'success': False, 'error': str(e)})
