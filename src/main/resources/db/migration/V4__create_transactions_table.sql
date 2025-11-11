-- Create transactions table for manual payment tracking
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    amount DOUBLE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    upi_ref VARCHAR(100),
    screenshot_url TEXT,
    payment_month VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    INDEX idx_transactions_tenant (tenant_id),
    INDEX idx_transactions_owner (owner_id),
    INDEX idx_transactions_property (property_id),
    INDEX idx_transactions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
