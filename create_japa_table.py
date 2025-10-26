#!/usr/bin/env python3
"""
🕉️  Japa Database Setup Script
Creates all necessary tables for Japa functionality in the existing database.
"""

import sys
import traceback
from db_config import get_db_connection

# -------------------------------------------------------------------
# 📿 16-Word Mantra Data
MANTRA_WORDS = [
    (1, 'राधे', 'radhe'),
    (2, 'कृष्णा', 'krishna'),
    (3, 'राधे', 'radhe'),
    (4, 'कृष्णा', 'krishna'),
    (5, 'कृष्णा', 'krishna'),
    (6, 'कृष्णा', 'krishna'),
    (7, 'राधे', 'radhe'),
    (8, 'राधे', 'radhe'),
    (9, 'राधे', 'radhe'),
    (10, 'शाम', 'sham'),
    (11, 'ऱाधे', 'radhe'),
    (12, 'शामा', 'shama'),
    (13, 'शाम', 'sham'),
    (14, 'शामा', 'shama'),
    (15, 'राधे', 'radhe'),
    (16, 'राधे', 'radhe')
]

# -------------------------------------------------------------------
# 📋 Table Creation Functions
def create_krasha_jap(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS krasha_jap (
            id INT AUTO_INCREMENT PRIMARY KEY,
            word_order INT NOT NULL UNIQUE,
            word_devanagari VARCHAR(50) NOT NULL,
            word_english VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_word_order (word_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created krasha_jap table")

def create_japa_sessions(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS japa_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100) NOT NULL,
            total_count INT DEFAULT 0,
            current_word_index INT DEFAULT 1,
            session_active BOOLEAN DEFAULT TRUE,
            session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_active (user_id, session_active),
            INDEX idx_session_start (session_start)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created japa_sessions table")

def create_japa_daily_counts(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS japa_daily_counts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100) NOT NULL,
            japa_date DATE NOT NULL,
            total_rounds INT DEFAULT 0,
            total_words INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_date (user_id, japa_date),
            INDEX idx_japa_date (japa_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created japa_daily_counts table")

# -------------------------------------------------------------------
# 📿 Mantra Insert
def insert_mantra_words(cursor):
    cursor.execute("SELECT COUNT(*) FROM krasha_jap")
    result = cursor.fetchone()
    word_count = result[0] if isinstance(result, tuple) else 0

    if word_count == 0:
        cursor.executemany("""
            INSERT INTO krasha_jap (word_order, word_devanagari, word_english)
            VALUES (%s, %s, %s)
        """, MANTRA_WORDS)
        print("✅ Inserted 16-word mantra")
    else:
        print(f"✅ Mantra words already exist ({word_count} words)")

# -------------------------------------------------------------------
# 🧪 Check Existing Tables
def check_existing_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        tables_to_check = ['krasha_jap', 'japa_sessions', 'japa_daily_counts']
        existing_tables = []

        for table in tables_to_check:
            cursor.execute(f"SHOW TABLES LIKE '{table}'")
            if cursor.fetchone():
                existing_tables.append(table)

        if existing_tables:
            print("📋 Existing Japa tables found:")
            for table in existing_tables:
                print(f"   - {table}")
            choice = input("\n⚠️  Continue anyway? (y/N): ").strip().lower()
            if choice not in ('y', 'yes'):
                print("❌ Setup cancelled")
                return False

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print("❌ Error checking existing tables:")
        traceback.print_exc()
        return False

# -------------------------------------------------------------------
# 🛠️ Main Setup
def create_japa_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("🔄 Creating Japa tables...")
        create_krasha_jap(cursor)
        create_japa_sessions(cursor)
        create_japa_daily_counts(cursor)
        insert_mantra_words(cursor)

        conn.commit()
        cursor.close()
        conn.close()

        print("\n🎉 Japa database setup completed successfully!")
        print("Tables created/verified:")
        print("- krasha_jap: Stores the 16 mantra words")
        print("- japa_sessions: Stores user japa sessions")
        print("- japa_daily_counts: Stores daily statistics")
        return True
    except Exception as e:
        print("❌ Error setting up japa tables:")
        traceback.print_exc()
        return False

# -------------------------------------------------------------------
# 📿 Display Mantra
def show_mantra_words():
    print("\n📿 16-Word Mantra:\nराधे कृष्णा राधे कृष्णा कृष्णा कृष्णा राधे राधे राधे शाम राधे शामा शाम शामा राधे राधे\n")
    for i, (_, dev, eng) in enumerate(MANTRA_WORDS, 1):
        print(f"{i:2d}. {dev} ({eng})")

# -------------------------------------------------------------------
# 🚀 Entry Point
if __name__ == "__main__":
    print("🕉️  Japa Database Setup")
    print("=" * 30)

    try:
        conn = get_db_connection()
        if conn:
            print("✅ Database connection successful")
            conn.close()
        else:
            print("❌ Could not connect to database")
            sys.exit(1)
    except Exception as e:
        print("❌ Database connection error:")
        traceback.print_exc()
        sys.exit(1)

    show_mantra_words()

    if not check_existing_tables():
        sys.exit(1)

    if create_japa_tables():
        print("\n🚀 Setup complete! You can now:")
        print("1. Add the japa blueprint to your app.py:")
        print("   from routes.japa import japa_bp")
        print("   app.register_blueprint(japa_bp)")
        print("2. Access /japa in your browser")
        print("3. Begin your japa sadhana with divine clarity 🌸")
    else:
        print("\n❌ Setup failed. Please review the errors above.")
        sys.exit(1)
