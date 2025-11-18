-- Create table to track monthly payment status for tenants without creating actual transactions
-- This is for non-primary tenants who don't make payments but are marked as "paid" when primary tenant pays

CREATE TABLE tenant_monthly_payment_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    payment_month VARCHAR(10) NOT NULL, -- Format: "YYYY-MM"
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    marked_paid_date DATETIME NULL, -- When it was marked as paid
    marked_by VARCHAR(255) NULL, -- Who marked it as paid (e.g., "primary-tenant-payment", "manual-admin")
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenancy(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Ensure one record per tenant per month
    UNIQUE KEY unique_tenant_month (tenant_id, payment_month),
    
    -- Index for querying by property and month
    INDEX idx_property_month (property_id, payment_month),
    
    -- Index for querying paid status
    INDEX idx_paid_status (is_paid)
);

-- Add comments for clarity
ALTER TABLE tenant_monthly_payment_status COMMENT = 'Tracks monthly payment status for non-primary tenants without creating actual transaction records';