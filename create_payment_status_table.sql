-- Run this SQL in your MySQL database to create the tenant_monthly_payment_status table
-- This is needed for the new payment status tracking system

USE flatery_db;

CREATE TABLE tenant_monthly_payment_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    payment_month VARCHAR(10) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    marked_paid_date DATETIME NULL,
    marked_by VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenancy(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_tenant_month (tenant_id, payment_month),
    INDEX idx_property_month (property_id, payment_month),
    INDEX idx_paid_status (is_paid)
);

-- Verify table was created
DESCRIBE tenant_monthly_payment_status;