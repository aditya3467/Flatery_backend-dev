-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sender_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    redirect_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_user_read (user_id, is_read)
);

-- Add foreign key constraints (optional, depends on your User table structure)
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender 
--     FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
