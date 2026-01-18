-- Migration: Create password_reset_otp table for forgot password functionality

CREATE TABLE password_reset_otp (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_otp (otp),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    
    CONSTRAINT fk_password_reset_otp_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
