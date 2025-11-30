from db_config import get_db_connection
import re

def refresh_shivtandav_lyrics(file_path):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Step 1: Delete existing verses
    cursor.execute("DELETE FROM shivtandav_lyrics")

    # Step 2: Read and insert new verses
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    pattern = r'(.*?)॥\s*(\d+)\s*॥'
    matches = re.findall(pattern, raw_text, re.DOTALL)

    for content, verse_number in matches:
        cleaned_content = content.strip()
        cursor.execute(
            "INSERT INTO shivtandav_lyrics (verse_number, content, language) VALUES (%s, %s, %s)",
            (int(verse_number), cleaned_content, 'mr')
        )

    conn.commit()
    cursor.close()
    conn.close()
    print("🕉️ Shiv Tandav verses refreshed successfully.")

if __name__ == "__main__":
    refresh_shivtandav_lyrics("shivtandav.txt")
