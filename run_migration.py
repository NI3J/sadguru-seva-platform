#!/usr/bin/env python3
"""Run database migration to add image_path column to daily_programs table."""

from db_config import get_db_connection

def run_migration():
    """Add image_path column to daily_programs table if it doesn't exist."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT COUNT(*) as col_count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'daily_programs'
            AND COLUMN_NAME = 'image_path'
        """)
        result = cursor.fetchone()
        col_exists = result[0] > 0 if isinstance(result, tuple) else result.get('col_count', 0) > 0
        
        if col_exists:
            print("✅ Column 'image_path' already exists in daily_programs table.")
        else:
            # Add the column
            cursor.execute("""
                ALTER TABLE `daily_programs` 
                ADD COLUMN `image_path` VARCHAR(255) NULL DEFAULT NULL AFTER `content`
            """)
            conn.commit()
            print("✅ Successfully added 'image_path' column to daily_programs table.")
            
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()
