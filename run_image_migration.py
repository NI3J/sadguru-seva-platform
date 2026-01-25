#!/usr/bin/env python3
"""
Migration script to add image_path column to daily_programs table
"""

from db_config import get_db_connection

def run_migration():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'daily_programs' 
            AND COLUMN_NAME = 'image_path'
        """)
        result = cursor.fetchone()
        
        if result and result[0] > 0:
            print("✅ Column 'image_path' already exists in daily_programs table")
        else:
            # Add the column
            cursor.execute("""
                ALTER TABLE `daily_programs` 
                ADD COLUMN `image_path` VARCHAR(255) NULL DEFAULT NULL AFTER `content`
            """)
            connection.commit()
            print("✅ Successfully added 'image_path' column to daily_programs table")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("🔄 Running migration to add image_path column...")
    run_migration()
    print("✅ Migration completed!")
