#!/usr/bin/env python3
"""Run database migration to create guru_mantra_progress table."""

from db_config import get_db_connection

def run_migration():
    """Create guru_mantra_progress table if it doesn't exist."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT COUNT(*) as table_count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'guru_mantra_progress'
        """)
        result = cursor.fetchone()
        table_exists = result[0] > 0 if isinstance(result, tuple) else result.get('table_count', 0) > 0
        
        if table_exists:
            print("✅ Table 'guru_mantra_progress' already exists.")
        else:
            # Create the table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `guru_mantra_progress` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `bhaktgan_id` int(11) NOT NULL,
                  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `count` int(11) DEFAULT 0 COMMENT 'Total count - NEVER resets',
                  `total_malas` int(11) DEFAULT 0 COMMENT 'Total malas - NEVER resets',
                  `current_mala_pronunciations` int(11) DEFAULT 0 COMMENT 'Current mala progress (0-108)',
                  `total_pronunciations` int(11) DEFAULT 0 COMMENT 'Total pronunciations - NEVER resets',
                  `today_pronunciations` int(11) DEFAULT 0 COMMENT 'Todays pronunciations - resets at IST midnight',
                  `today_malas` int(11) DEFAULT 0 COMMENT 'Todays malas - resets at IST midnight',
                  `today_date` date DEFAULT NULL COMMENT 'Current IST date for tracking',
                  `todays_count` int(11) DEFAULT 0 COMMENT 'Todays count - resets at IST midnight',
                  `last_spoken_at` datetime DEFAULT NULL,
                  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `unique_bhaktgan` (`bhaktgan_id`),
                  KEY `idx_bhaktgan_id` (`bhaktgan_id`),
                  KEY `idx_today_date` (`today_date`),
                  KEY `idx_bhaktgan_today` (`bhaktgan_id`, `today_date`),
                  CONSTRAINT `fk_guru_mantra_bhaktgan` FOREIGN KEY (`bhaktgan_id`) REFERENCES `bhaktgan` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            conn.commit()
            print("✅ Successfully created 'guru_mantra_progress' table.")
            
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
