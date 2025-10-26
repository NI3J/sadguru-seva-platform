#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fixed Krishna Lila Full Content Inserter
Ensures complete content is preserved and inserted
"""

import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("../database.env")

def get_db_connection():
    """Get MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'metro.proxy.rlwy.net'),
            port=int(os.getenv('MYSQL_PORT', 52774)),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DB', 'railway'),
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            autocommit=True
        )
        print("Database connected successfully!")
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def read_full_content(filename):
    """Read complete content from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Read {len(content)} characters from {filename}")
        return content
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return ""

def extract_field_content(text, field_name, next_field_names=None):
    """Extract complete content for a specific field"""
    start_marker = f"{field_name}:"
    start_pos = text.find(start_marker)
    
    if start_pos == -1:
        return ""
    
    # Start after the field marker
    content_start = start_pos + len(start_marker)
    
    # Find the end - look for next field or end of text
    end_pos = len(text)
    
    if next_field_names:
        for next_field in next_field_names:
            next_marker = f"\n{next_field}:"
            found_pos = text.find(next_marker, content_start)
            if found_pos != -1 and found_pos < end_pos:
                end_pos = found_pos
    
    # Extract and clean content
    content = text[content_start:end_pos].strip()
    
    # Clean up content - remove extra whitespace but preserve paragraphs
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line:
            cleaned_lines.append(line)
        elif cleaned_lines and cleaned_lines[-1]:  # Preserve paragraph breaks
            cleaned_lines.append('')
    
    # Remove trailing empty lines
    while cleaned_lines and not cleaned_lines[-1]:
        cleaned_lines.pop()
    
    return '\n'.join(cleaned_lines)

def parse_single_lila(text):
    """Parse a single lila from text content"""
    lila = {}
    
    # Define field order to help with extraction
    field_order = [
        'TITLE', 'DESCRIPTION', 'STORY', 'MORAL', 
        'SHLOKA', 'SHLOKA_TRANSLATION', 'TAGS', 
        'CATEGORY', 'DIFFICULTY', 'READING_TIME'
    ]
    
    for i, field in enumerate(field_order):
        next_fields = field_order[i+1:] if i < len(field_order)-1 else None
        content = extract_field_content(text, field, next_fields)
        
        if content:
            if field == 'TITLE':
                lila['title'] = content
            elif field == 'DESCRIPTION':
                lila['description'] = content
            elif field == 'STORY':
                lila['story'] = content
            elif field == 'MORAL':
                lila['moral'] = content
            elif field == 'SHLOKA':
                lila['shloka'] = content
            elif field == 'SHLOKA_TRANSLATION':
                lila['shloka_translation'] = content
            elif field == 'TAGS':
                lila['tags'] = content
            elif field == 'CATEGORY':
                lila['category'] = content.lower()
            elif field == 'DIFFICULTY':
                lila['difficulty'] = content.lower()
            elif field == 'READING_TIME':
                try:
                    lila['reading_time'] = int(content)
                except ValueError:
                    lila['reading_time'] = 5
    
    return lila

def parse_all_lilas(content):
    """Parse all lilas from content"""
    if not content:
        return []
    
    # Split by --- separator
    lila_blocks = content.split('---')
    lilas = []
    
    for i, block in enumerate(lila_blocks):
        block = block.strip()
        if not block:
            continue
            
        print(f"Parsing lila block {i+1}...")
        lila = parse_single_lila(block)
        
        if lila.get('title'):
            print(f"  Found: {lila['title'][:50]}...")
            if lila.get('story'):
                print(f"  Story length: {len(lila['story'])} characters")
            lilas.append(lila)
        else:
            print(f"  Skipping block {i+1} - no title found")
    
    return lilas

def insert_complete_lila(db, marathi_lila, english_lila, order_seq):
    """Insert complete lila with full content"""
    
    lila_data = {
        'title_english': english_lila.get('title', ''),
        'title_marathi': marathi_lila.get('title', ''),
        'description_english': english_lila.get('description', ''),
        'description_marathi': marathi_lila.get('description', ''),
        'story_english': english_lila.get('story', ''),
        'story_marathi': marathi_lila.get('story', ''),
        'moral_english': english_lila.get('moral', ''),
        'moral_marathi': marathi_lila.get('moral', ''),
        'shloka_sanskrit': marathi_lila.get('shloka') or english_lila.get('shloka'),
        'shloka_translation_english': english_lila.get('shloka_translation'),
        'shloka_translation_marathi': marathi_lila.get('shloka_translation'),
        'category': marathi_lila.get('category', 'childhood'),
        'age_group': 'all',
        'image_url': None,
        'thumbnail_url': None,
        'audio_url': None,
        'video_url': None,
        'order_sequence': order_seq,
        'is_featured': order_seq == 1,
        'is_active': True,
        'tags': marathi_lila.get('tags', '') or english_lila.get('tags', ''),
        'reading_time_minutes': marathi_lila.get('reading_time', 5),
        'difficulty_level': marathi_lila.get('difficulty', 'easy'),
        'created_by': 'Admin'
    }
    
    # Show content lengths for verification
    print(f"Content lengths:")
    print(f"  Marathi story: {len(lila_data['story_marathi'])} chars")
    print(f"  English story: {len(lila_data['story_english'])} chars")
    print(f"  Marathi title: {lila_data['title_marathi']}")
    print(f"  English title: {lila_data['title_english']}")
    
    insert_query = """
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
    
    try:
        cursor = db.cursor()
        cursor.execute(insert_query, lila_data)
        lila_id = cursor.lastrowid
        cursor.close()
        
        print(f"✅ Successfully inserted Lila ID: {lila_id}")
        return lila_id
    except Exception as e:
        print(f"❌ Error inserting lila: {e}")
        return None

def main():
    print("=" * 70)
    print("🌸 Fixed Full Content Krishna Lila Inserter")
    print("=" * 70)
    
    # File paths
    marathi_file = 'insert_marathi_content.txt'
    english_file = 'insert_english_content.txt'
    
    # Check files
    if not os.path.exists(marathi_file):
        print(f"❌ {marathi_file} not found!")
        return
    
    if not os.path.exists(english_file):
        print(f"❌ {english_file} not found!")
        return
    
    # Read complete content
    print("📖 Reading complete content...")
    marathi_content = read_full_content(marathi_file)
    english_content = read_full_content(english_file)
    
    # Parse all lilas
    print("\n🔍 Parsing all lilas...")
    marathi_lilas = parse_all_lilas(marathi_content)
    english_lilas = parse_all_lilas(english_content)
    
    print(f"\n📚 Parsing results:")
    print(f"   Marathi lilas: {len(marathi_lilas)}")
    print(f"   English lilas: {len(english_lilas)}")
    
    if not marathi_lilas and not english_lilas:
        print("❌ No lilas found to insert!")
        return
    
    # Show content preview
    if marathi_lilas:
        print(f"\n📝 Marathi content preview:")
        for i, lila in enumerate(marathi_lilas):
            print(f"   {i+1}. {lila['title']}")
            if 'story' in lila:
                story_preview = lila['story'][:100].replace('\n', ' ')
                print(f"      Story: {story_preview}...")
    
    # Connect and insert
    db = get_db_connection()
    if not db:
        return
    
    print(f"\n🚀 Starting insertion...")
    
    max_lilas = max(len(marathi_lilas), len(english_lilas))
    success_count = 0
    
    for i in range(max_lilas):
        print(f"\n--- Inserting Lila {i+1}/{max_lilas} ---")
        
        marathi_lila = marathi_lilas[i] if i < len(marathi_lilas) else {}
        english_lila = english_lilas[i] if i < len(english_lilas) else {}
        
        if marathi_lila or english_lila:
            lila_id = insert_complete_lila(db, marathi_lila, english_lila, i + 1)
            if lila_id:
                success_count += 1
    
    db.close()
    
    print(f"\n🎉 Insertion completed!")
    print(f"✅ Successfully inserted: {success_count}/{max_lilas} lilas")
    print("🔗 Check your website to see the full content!")

if __name__ == "__main__":
    main()
