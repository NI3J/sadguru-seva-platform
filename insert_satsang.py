from db_config import get_db_connection

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read().strip()

# 🌿 Load content from files
marathi_content = read_file('content/satsang_001_marathi.txt')
english_content = read_file('content/satsang_001_english.txt')

# 🌸 Metadata
page_number = 2 
title = 'सद्गुरू वाणी'
author = 'प.पु.श्री.अशोककाका शास्त्री'
date = '2025-08-18'
is_active = 1

# 🚀 Insert query
insert_query = """
    INSERT INTO satsang (
        page_number,
        title,
        content,
        content_en,
        author,
        date,
        is_active
    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

# 🔧 Execute insert
try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(insert_query, (
        page_number,
        title,
        marathi_content,
        english_content,
        author,
        date,
        is_active
    ))
    conn.commit()
    print("✅ Satsang inserted successfully.")
except Exception as e:
    print("❌ Error inserting satsang:", e)
finally:
    conn.close()

