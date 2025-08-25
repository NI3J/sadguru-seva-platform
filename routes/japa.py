from flask import Blueprint, render_template, request, jsonify, session
from db_config import get_db_connection
from datetime import datetime, date

japa_bp = Blueprint('japa', __name__)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌸 Route: Japa Page
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@japa_bp.route('/japa')
def japa_page():
    """Render the main japa page"""
    try:
        connection = get_db_connection()
        if not connection:
            return render_template('japa.html', error="🙏 क्षमस्व, डेटाबेसशी जोडता आले नाही.")

        cursor = connection.cursor()  # ✅ DictCursor already set in db_config.py

        # 🌼 Fetch mantra text
        cursor.execute("SELECT mantra_text FROM japa_mantras WHERE id = 1")
        mantra_result = cursor.fetchone()
        mantra_text = mantra_result['mantra_text'] if mantra_result else (
            "राधे कृष्णा राधे कृष्णा कृष्णा कृष्णा राधे राधे राम राम हरे हरे हरे हरे राम राम"
        )

        # 🙏 Fetch today's session data
        user_id = session.get('user_id', 1)
        today = date.today()

        cursor.execute("""
            SELECT total_count, mantra_rounds
            FROM japa_sessions
            WHERE user_id = %s AND session_date = %s
            ORDER BY created_at DESC LIMIT 1
        """, (user_id, today))

        session_data = cursor.fetchone()
        current_count = session_data['total_count'] if session_data else 0
        current_rounds = session_data['mantra_rounds'] if session_data else 0

        cursor.close()
        connection.close()

        return render_template('japa.html',
                               mantra_text=mantra_text,
                               current_count=current_count,
                               current_rounds=current_rounds)

    except Exception as e:
        print(f"Error in japa_page: {e}")
        return render_template('japa.html', error="🙏 क्षमस्व, काहीतरी तांत्रिक अडचण आली आहे.")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔄 API: Update Japa Count
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@japa_bp.route('/api/japa/update-count', methods=['POST'])
def update_japa_count():
    """Update japa count via API"""
    try:
        data = request.get_json()
        count = data.get('count', 0)
        rounds = data.get('rounds', 0)

        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': '🙏 डेटाबेसशी जोडता आले नाही.'})

        cursor = connection.cursor()
        user_id = session.get('user_id', 1)
        today = date.today()

        # 🔍 Check if session exists
        cursor.execute("""
            SELECT id FROM japa_sessions
            WHERE user_id = %s AND session_date = %s
            ORDER BY created_at DESC LIMIT 1
        """, (user_id, today))

        existing_session = cursor.fetchone()

        if existing_session:
            # ✏️ Update existing session
            cursor.execute("""
                UPDATE japa_sessions
                SET total_count = %s, mantra_rounds = %s, end_time = %s
                WHERE id = %s
            """, (count, rounds, datetime.now(), existing_session['id']))
        else:
            # 🆕 Create new session
            cursor.execute("""
                INSERT INTO japa_sessions (user_id, session_date, total_count, mantra_rounds)
                VALUES (%s, %s, %s, %s)
            """, (user_id, today, count, rounds))

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({'success': True, 'count': count, 'rounds': rounds})

    except Exception as e:
        print(f"Error updating japa count: {e}")
        return jsonify({'success': False, 'error': str(e)})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 API: Get Japa Stats
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@japa_bp.route('/api/japa/get-stats')
def get_japa_stats():
    """Get japa statistics"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'success': False, 'error': '🙏 डेटाबेसशी जोडता आले नाही.'})

        cursor = connection.cursor()
        user_id = session.get('user_id', 1)
        today = date.today()

        # 📅 Today's stats
        cursor.execute("""
            SELECT total_count, mantra_rounds
            FROM japa_sessions
            WHERE user_id = %s AND session_date = %s
            ORDER BY created_at DESC LIMIT 1
        """, (user_id, today))
        today_stats = cursor.fetchone()

        # 📈 Total stats
        cursor.execute("""
            SELECT SUM(total_count) as total_count, SUM(mantra_rounds) as total_rounds
            FROM japa_sessions
            WHERE user_id = %s
        """, (user_id,))
        total_stats = cursor.fetchone()

        cursor.close()
        connection.close()

        return jsonify({
            'success': True,
            'today': {
                'count': today_stats['total_count'] if today_stats else 0,
                'rounds': today_stats['mantra_rounds'] if today_stats else 0
            },
            'total': {
                'count': total_stats['total_count'] if total_stats and total_stats['total_count'] else 0,
                'rounds': total_stats['total_rounds'] if total_stats and total_stats['total_rounds'] else 0
            }
        })

    except Exception as e:
        print(f"Error getting japa stats: {e}")
        return jsonify({'success': False, 'error': str(e)})
