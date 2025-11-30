import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables from database.env
load_dotenv("database.env")

def get_db_connection():
    """Get MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', os.getenv('HOST', 'metro.proxy.rlwy.net')),
            port=int(os.getenv('MYSQL_PORT', 52774)),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DB', 'railway'),
            charset='utf8mb4',
            use_unicode=True,
            autocommit=True
        )
        print("✅ Database connected successfully!")
        return connection
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def clean_story_text(text: str) -> str:
    """Remove HTML <br> tags and trim extra spaces"""
    return text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n").strip()

def insert_krishna_lila():
    """Insert Krishna Lila story into the database"""
    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()

    # Read and clean story files
    with open("story_in_english.txt", "r", encoding="utf-8") as f:
        story_english = clean_story_text(f.read())

    with open("story_in_marathi.txt", "r", encoding="utf-8") as f:
        story_marathi = clean_story_text(f.read())


    # Prepare data
    data = {
        "title_english": "Birth Story of Shri Krishna - Divine Incarnation",
        "title_marathi": "श्री कृष्ण जन्मलीला",
        "description_english": "Lord Krishna's birth and the divine purpose of His incarnation.",
        "description_marathi": "भगवान श्रीकृष्णाच्या जन्माची आणि त्यांच्या अवताराच्या दैवी उद्देशाची कथा.",
        "story_english": story_english,
        "story_marathi": story_marathi,
        "moral_english": "Whenever dharma declines, the Lord incarnates to restore it.",
        "moral_marathi": "जेंव्हा धर्माला ग्लानी येते, तेंव्हा भगवान त्याची पुनर्स्थापना करण्यासाठी अवतार घेतात.",
        "shloka_sanskrit": "यदा यदा ही धर्मस्य ग्लानिर्भवति भारत|अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम||परित्राणाय साधुंना विनाशाय च दुष्कृताम||धर्मसंस्थापनार्थाय संम्भवामि युगे युगे||",
        "shloka_translation_english": "Whenever there is a decline in righteousness, O Bharat, and a rise in unrighteousness, I manifest Myself. For the protection of the righteous, to annihilate the wicked, and to reestablish the principles of dharma, I appear millennium after millennium. Lord Sri Krishna told Arjuna - this is the reason for My appearance; I come of My own free will. It is My wish that I descend whenever righteousness is in decline and unrighteousness begins to spread. I manifest century after century for My pure devotees, to destroy the wicked, and to reestablish dharma.",
        "shloka_translation_marathi": "माझ्या अविर्भावाचे हेच कारण आहे की मी स्वेच्छामयी आहे. माझ्या इश्चेनेच मी अवतीर्ण होतो. जेंव्हा जेंव्हा धर्माला ग्लानी येते आणि अधर्म पसरु लागतो, तेंव्हा तेंव्हा स्वेच्छापुर्वक मी अवतीर्ण होतो. मी आपल्या शुध्द भक्तांसाठी,दुष्टांचा नाश करण्यासाठी आणि धर्माची पुनरस्थापना करण्यासाठी युगानुयुगे अवतरित होतो.",
        "category": "childhood",
        "age_group": "all",
        "image_url": None,
        "thumbnail_url": None,
        "audio_url": None,
        "video_url": None,
        "order_sequence": 1,
        "is_featured": 1,
        "is_active": 1,
        "tags": "Krishna, Birth, Avatar, Dharma",
        "reading_time_minutes": 8,
        "difficulty_level": "medium",
        "created_by": "Nitin"
    }

    # Insert query
    sql = """
    INSERT INTO krishna_lila (
        title_english, title_marathi, description_english, description_marathi,
        story_english, story_marathi, moral_english, moral_marathi,
        shloka_sanskrit, shloka_translation_english, shloka_translation_marathi,
        category, age_group, image_url, thumbnail_url, audio_url, video_url,
        order_sequence, is_featured, is_active, tags, reading_time_minutes,
        difficulty_level, created_by
    ) VALUES (
        %(title_english)s, %(title_marathi)s, %(description_english)s, %(description_marathi)s,
        %(story_english)s, %(story_marathi)s, %(moral_english)s, %(moral_marathi)s,
        %(shloka_sanskrit)s, %(shloka_translation_english)s, %(shloka_translation_marathi)s,
        %(category)s, %(age_group)s, %(image_url)s, %(thumbnail_url)s, %(audio_url)s, %(video_url)s,
        %(order_sequence)s, %(is_featured)s, %(is_active)s, %(tags)s, %(reading_time_minutes)s,
        %(difficulty_level)s, %(created_by)s
    )
    """

    cursor.execute(sql, data)
    conn.commit()
    print(f"✅ Inserted record with ID: {cursor.lastrowid}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    insert_krishna_lila()


