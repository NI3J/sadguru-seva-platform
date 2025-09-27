-- =================================
-- 🌸 Enhanced Photo Features Migration
-- Add new columns and features to virtuous_photos table
-- =================================

-- Add new columns to virtuous_photos table
ALTER TABLE virtuous_photos 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'darshan' AFTER description,
ADD COLUMN IF NOT EXISTS tags TEXT AFTER category,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 AFTER tags,
ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER view_count,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER upload_date,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER updated_at;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_virtuous_photos_category ON virtuous_photos(category);
CREATE INDEX IF NOT EXISTS idx_virtuous_photos_active ON virtuous_photos(is_active);
CREATE INDEX IF NOT EXISTS idx_virtuous_photos_upload_date ON virtuous_photos(upload_date);
CREATE INDEX IF NOT EXISTS idx_virtuous_photos_view_count ON virtuous_photos(view_count);

-- Update existing photos with default values
UPDATE virtuous_photos 
SET 
    category = 'darshan',
    tags = 'दर्शन, आध्यात्म, शांती',
    upload_date = NOW(),
    is_active = TRUE
WHERE category IS NULL OR category = '';

-- Create photo categories table (optional - for future use)
CREATE TABLE IF NOT EXISTS photo_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO photo_categories (id, name, description) VALUES
('darshan', 'दर्शन', 'सद्गुरूंचे पावन दर्शन'),
('satsang', 'सत्संग', 'सत्संग कार्यक्रम'),
('festivals', 'सण', 'धार्मिक सण आणि उत्सव'),
('ashram', 'आश्रम', 'आश्रमाचे दृश्य'),
('devotees', 'भक्तगण', 'भक्तगणांचे कार्यक्रम'),
('nature', 'निसर्ग', 'आध्यात्मिक निसर्ग दृश्य');

-- Create photo views tracking table (optional - for analytics)
CREATE TABLE IF NOT EXISTS photo_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES virtuous_photos(id) ON DELETE CASCADE
);

-- Create index for photo views
CREATE INDEX IF NOT EXISTS idx_photo_views_photo_id ON photo_views(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_views_viewed_at ON photo_views(viewed_at);

-- Create photo favorites table (optional - for future use)
CREATE TABLE IF NOT EXISTS photo_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    user_id VARCHAR(100),
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES virtuous_photos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_photo (photo_id, user_id)
);

-- Create index for photo favorites
CREATE INDEX IF NOT EXISTS idx_photo_favorites_photo_id ON photo_favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_user_id ON photo_favorites(user_id);

-- Add sample data for testing (optional)
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
CREATE PROCEDURE IF NOT EXISTS IncrementPhotoView(IN photo_id INT)
BEGIN
    UPDATE virtuous_photos 
    SET view_count = view_count + 1 
    WHERE id = photo_id AND is_active = TRUE;
END //
DELIMITER ;

-- Create a function to get photo category name
DELIMITER //
CREATE FUNCTION IF NOT EXISTS GetCategoryName(category_id VARCHAR(50))
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