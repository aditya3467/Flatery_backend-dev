-- Migration: V8 - Create tenancy_history table for managing tenant history after vacation
-- Purpose: Store historical tenant data when they move out, enable tenant re-admission

-- Create tenancy_history table
CREATE TABLE tenancy_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Tenant Information (copied from original tenant record)
    tenant_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(120),
    
    -- Property and Ownership Details (IDs only for simplicity)
    property_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    
    -- Specific unit identifier
    flat_room_number VARCHAR(40),
    
    -- Unit assignment (for PG/shared housing)
    floor_id BIGINT,
    unit_id BIGINT,
    bed_index INTEGER,
    
    -- Financial Information
    rent_amount INTEGER NOT NULL,
    security_deposit INTEGER NOT NULL,
    rent_due_date INTEGER,
    
    -- Tenancy Period
    move_in_date DATE,
    move_out_date DATE,
    lease_end_date DATE,
    
    -- Status and Reason
    vacate_reason VARCHAR(500),
    
    -- Timestamps
    tenancy_start_date DATETIME NOT NULL,
    tenancy_end_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_tenancy_history_phone ON tenancy_history(phone_number);
CREATE INDEX idx_tenancy_history_email ON tenancy_history(email_address);
CREATE INDEX idx_tenancy_history_property ON tenancy_history(property_id);
CREATE INDEX idx_tenancy_history_owner ON tenancy_history(owner_id);
CREATE INDEX idx_tenancy_history_move_out ON tenancy_history(move_out_date);

-- Add foreign key constraints (if needed for data integrity)
-- ALTER TABLE tenancy_history ADD CONSTRAINT fk_tenancy_history_property FOREIGN KEY (property_id) REFERENCES properties(id);
-- ALTER TABLE tenancy_history ADD CONSTRAINT fk_tenancy_history_owner FOREIGN KEY (owner_id) REFERENCES users(id);