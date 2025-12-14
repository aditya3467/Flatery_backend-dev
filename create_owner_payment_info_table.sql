-- Create owner_payment_info table for storing owner payment details
CREATE TABLE IF NOT EXISTS owner_payment_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner_id BIGINT NOT NULL UNIQUE,
    upi_id VARCHAR(100),
    qr_image_url VARCHAR(255),
    preferred_mode VARCHAR(20),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    updated_by VARCHAR(50),
    
    CONSTRAINT fk_owner_payment_info_owner 
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_preferred_mode 
        CHECK (preferred_mode IN ('UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'ONLINE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster lookups
CREATE INDEX idx_owner_payment_info_owner_id ON owner_payment_info(owner_id);
CREATE INDEX idx_owner_payment_info_is_active ON owner_payment_info(is_active);
