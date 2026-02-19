from db_config import get_db_connection

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
    insert_satsang_entry(
        page_number=1,
        title=': सर्व आपल्या कर्माच फळ आहे:',
        marathi_path='content/satsang_001_marathi.txt',
        english_path='content/satsang_001_english.txt',
        author='प.पु.श्री.अशोककाका शास्त्री',
        date='2025-08-28'
    )


