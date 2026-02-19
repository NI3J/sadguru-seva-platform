from datetime import date, timedelta
from db_config import get_db_connection

# Must match routes/wisdom.py - satsang starts Aug 17, 2025
SATSANG_START_DATE = date(2025, 8, 17)

def get_today_page_number():
    """Get today's page number (same logic as the satsang web page)."""
    today = date.today()
    return max(1, (today - SATSANG_START_DATE).days + 1)

def read_file(path):
    """📖 Read and return content from a text file."""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read().strip()

def insert_satsang_entry(
    page_number,
    title,
    marathi_path,
    english_path,
    author,
    date,
    is_active=1
):
    """🌸 Insert a satsang entry into the database."""
    marathi_content = read_file(marathi_path)
    english_content = read_file(english_path)

    query = """
        INSERT INTO satsang (
            page_number,
            title,
            content,
            content_en,
            author,
            date,
            is_active,
            marathi_content,
            english_content
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            content = VALUES(content),
            content_en = VALUES(content_en),
            author = VALUES(author),
            date = VALUES(date),
            is_active = VALUES(is_active),
            marathi_content = VALUES(marathi_content),
            english_content = VALUES(english_content)
    """

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, (
            page_number,
            title,
            marathi_content,
            english_content,
            author,
            date,
            is_active,
            marathi_content,
            english_content
        ))
        conn.commit()
        rows_affected = cursor.rowcount
        if rows_affected == 1:
            print(f"✅ Satsang entry for page {page_number} inserted successfully.")
        else:
            print(f"✅ Satsang entry for page {page_number} updated successfully.")
    except Exception as e:
        print(f"❌ Error inserting satsang entry: {e}")
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass

if __name__ == "__main__":
    import sys

    # Use today's page by default, or pass a specific page: python3.10 insert_satsang.py 183
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        page_num = int(sys.argv[1])
    else:
        page_num = get_today_page_number()

    page_date = SATSANG_START_DATE + timedelta(days=page_num - 1)

    insert_satsang_entry(
        page_number=page_num,
        title=':शिवमहापुराण कथा:',
        marathi_path='content/satsang_001_marathi.txt',
        english_path='content/satsang_001_english.txt',
        author='प.पु.श्री.गुरुदेव विद्यानंद महाराज(बाबा)',
        date=page_date.strftime('%Y-%m-%d')
    )
    print(f"💡 View at: /knowledge/satsang?page={page_num}")


