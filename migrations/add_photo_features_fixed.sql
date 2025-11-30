-- =================================
-- 🌸 Enhanced Photo Features Migration (MySQL Compatible)
-- Add new columns and features to virtuous_photos table
-- Compatible with MySQL 5.7+ and 8.0+
-- =================================

-- First, check if virtuous_photos table exists, if not create it
CREATE TABLE IF NOT EXISTS virtuous_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    title VARCHAR(200),
    description TEXT,
    alt_text VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns one by one (MySQL compatible way)
-- Check if column exists before adding
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'category') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN category VARCHAR(50) DEFAULT "darshan" AFTER description',
    'SELECT "Column category already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'tags') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN tags TEXT AFTER category',
    'SELECT "Column tags already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'view_count') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN view_count INT DEFAULT 0 AFTER tags',
    'SELECT "Column view_count already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'upload_date') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER view_count',
    'SELECT "Column upload_date already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'updated_at') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER upload_date',
    'SELECT "Column updated_at already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND COLUMN_NAME = 'is_active') = 0,
    'ALTER TABLE virtuous_photos ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER updated_at',
    'SELECT "Column is_active already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes (with error handling)
SET @sql = 'CREATE INDEX idx_virtuous_photos_category ON virtuous_photos(category)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND INDEX_NAME = 'idx_virtuous_photos_category') = 0,
    @sql,
    'SELECT "Index idx_virtuous_photos_category already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX idx_virtuous_photos_active ON virtuous_photos(is_active)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND INDEX_NAME = 'idx_virtuous_photos_active') = 0,
    @sql,
    'SELECT "Index idx_virtuous_photos_active already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX idx_virtuous_photos_upload_date ON virtuous_photos(upload_date)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND INDEX_NAME = 'idx_virtuous_photos_upload_date') = 0,
    @sql,
    'SELECT "Index idx_virtuous_photos_upload_date already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX idx_virtuous_photos_view_count ON virtuous_photos(view_count)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'virtuous_photos' 
     AND INDEX_NAME = 'idx_virtuous_photos_view_count') = 0,
    @sql,
    'SELECT "Index idx_virtuous_photos_view_count already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing photos with default values
UPDATE virtuous_photos 
SET 
    category = 'darshan',
    tags = 'दर्शन, आध्यात्म, शांती',
    upload_date = NOW(),
    is_active = TRUE
WHERE category IS NULL OR category = '' OR category = 'darshan';

-- Create photo categories table
CREATE TABLE IF NOT EXISTS photo_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories (ignore duplicates)
INSERT IGNORE INTO photo_categories (id, name, description) VALUES
('darshan', 'दर्शन', 'सद्गुरूंचे पावन दर्शन'),
('satsang', 'सत्संग', 'सत्संग कार्यक्रम'),
('festivals', 'सण', 'धार्मिक सण आणि उत्सव'),
('ashram', 'आश्रम', 'आश्रमाचे दृश्य'),
('devotees', 'भक्तगण', 'भक्तगणांचे कार्यक्रम'),
('nature', 'निसर्ग', 'आध्यात्मिक निसर्ग दृश्य');

-- Create photo views tracking table
CREATE TABLE IF NOT EXISTS photo_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES virtuous_photos(id) ON DELETE CASCADE
);

-- Create indexes for photo views
SET @sql = 'CREATE INDEX idx_photo_views_photo_id ON photo_views(photo_id)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'photo_views' 
     AND INDEX_NAME = 'idx_photo_views_photo_id') = 0,
    @sql,
    'SELECT "Index idx_photo_views_photo_id already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX idx_photo_views_viewed_at ON photo_views(viewed_at)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'photo_views' 
     AND INDEX_NAME = 'idx_photo_views_viewed_at') = 0,
    @sql,
    'SELECT "Index idx_photo_views_viewed_at already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create photo favorites table
CREATE TABLE IF NOT EXISTS photo_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    user_id VARCHAR(100),
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES virtuous_photos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_photo (photo_id, user_id)
);

-- Create indexes for photo favorites
SET @sql = 'CREATE INDEX idx_photo_favorites_photo_id ON photo_favorites(photo_id)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'photo_favorites' 
     AND INDEX_NAME = 'idx_photo_favorites_photo_id') = 0,
    @sql,
    'SELECT "Index idx_photo_favorites_photo_id already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'CREATE INDEX idx_photo_favorites_user_id ON photo_favorites(user_id)';
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'photo_favorites' 
     AND INDEX_NAME = 'idx_photo_favorites_user_id') = 0,
    @sql,
    'SELECT "Index idx_photo_favorites_user_id already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add sample data for testing (only if no data exists)
INSERT IGNORE INTO virtuous_photos (image_path, title, description, alt_text, category, tags, is_active) VALUES
('/static/images/virtue1.jpg', 'सद्गुरूंचे पहिले दर्शन', 'सद्गुरूंचे पावन दर्शन - आध्यात्मिक प्रेरणा आणि शांतीचा अनुभव', 'सद्गुरूंचे दर्शन 1', 'darshan', 'दर्शन, आध्यात्म, शांती', TRUE),
('/static/images/virtue2.jpg', 'सद्गुरूंचे दुसरे दर्शन', 'सद्गुरूंचे पावन दर्शन - भक्ती आणि प्रेमाचा अनुभव', 'सद्गुरूंचे दर्शन 2', 'darshan', 'दर्शन, भक्ती, प्रेम', TRUE),
('/static/images/virtue3.jpg', 'सद्गुरूंचे तिसरे दर्शन', 'सद्गुरूंचे पावन दर्शन - ज्ञान आणि प्रकाशाचा अनुभव', 'सद्गुरूंचे दर्शन 3', 'darshan', 'दर्शन, ज्ञान, प्रकाश', TRUE),
('/static/images/virtue4.jpg', 'सद्गुरूंचे चौथे दर्शन', 'सद्गुरूंचे पावन दर्शन - करुणा आणि दया', 'सद्गुरूंचे दर्शन 4', 'darshan', 'दर्शन, करुणा, दया', TRUE),
('/static/images/virtue5.jpg', 'सद्गुरूंचे पाचवे दर्शन', 'सद्गुरूंचे पावन दर्शन - आनंद आणि उत्साह', 'सद्गुरूंचे दर्शन 5', 'darshan', 'दर्शन, आनंद, उत्साह', TRUE),
('/static/images/virtue6.jpg', 'सद्गुरूंचे सहावे दर्शन', 'सद्गुरूंचे पावन दर्शन - शक्ती आणि ऊर्जा', 'सद्गुरूंचे दर्शन 6', 'darshan', 'दर्शन, शक्ती, ऊर्जा', TRUE);

-- Create a view for easy photo statistics
CREATE OR REPLACE VIEW photo_statistics AS
SELECT 
    COUNT(*) as total_photos,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_photos,
    COUNT(CASE WHEN category = 'darshan' THEN 1 END) as darshan_photos,
    COUNT(CASE WHEN category = 'satsang' THEN 1 END) as satsang_photos,
    COUNT(CASE WHEN category = 'festivals' THEN 1 END) as festival_photos,
    COUNT(CASE WHEN category = 'ashram' THEN 1 END) as ashram_photos,
    COUNT(CASE WHEN category = 'devotees' THEN 1 END) as devotee_photos,
    COUNT(CASE WHEN category = 'nature' THEN 1 END) as nature_photos,
    SUM(view_count) as total_views,
    AVG(view_count) as avg_views,
    MAX(view_count) as max_views,
    MIN(upload_date) as oldest_photo,
    MAX(upload_date) as newest_photo
FROM virtuous_photos;

-- Create a stored procedure for updating view count
DELIMITER //
DROP PROCEDURE IF EXISTS IncrementPhotoView //
CREATE PROCEDURE IncrementPhotoView(IN photo_id INT)
BEGIN
    UPDATE virtuous_photos 
    SET view_count = view_count + 1 
    WHERE id = photo_id AND is_active = TRUE;
END //
DELIMITER ;

-- Create a function to get photo category name
DELIMITER //
DROP FUNCTION IF EXISTS GetCategoryName //
CREATE FUNCTION GetCategoryName(category_id VARCHAR(50))
RETURNS VARCHAR(100)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE category_name VARCHAR(100);
    
    SELECT name INTO category_name 
    FROM photo_categories 
    WHERE id = category_id;
    
    IF category_name IS NULL THEN
        SET category_name = category_id;
    END IF;
    
    RETURN category_name;
END //
DELIMITER ;

-- Add comments for documentation
ALTER TABLE virtuous_photos COMMENT = 'Enhanced virtuous photos with categories, tags, and view tracking';
ALTER TABLE photo_categories COMMENT = 'Photo categories for organization';
ALTER TABLE photo_views COMMENT = 'Photo view tracking for analytics';
ALTER TABLE photo_favorites COMMENT = 'User photo favorites';

-- Show migration results
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_photos FROM virtuous_photos;
SELECT COUNT(*) as total_categories FROM photo_categories;
SELECT 'All tables and indexes created successfully!' as final_status;