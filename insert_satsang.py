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
    """

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
        print(f"✅ Satsang entry for page {page_number} inserted successfully.")
    except Exception as e:
        print(f"❌ Error inserting satsang entry: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    insert_satsang_entry(
        page_number=8,
        title=':सद्गुरू वाणी:ईश्र्वरावर विश्र्वास किंवा विसंबून राहणे:',
        marathi_path='content/satsang_001_marathi.txt',
        english_path='content/satsang_001_english.txt',
        author='प.पु.श्री.अशोककाका शास्त्री',
        date='2025-08-24'
    )


