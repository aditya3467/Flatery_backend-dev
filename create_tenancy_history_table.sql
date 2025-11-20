CREATE TABLE tenancy_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Tenant Information (copied from original tenant record)
    tenant_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email_address VARCHAR(100),
    emergency_contact VARCHAR(15),
    id_proof_type ENUM('AADHAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'PAN_CARD') NOT NULL,
    id_proof_number VARCHAR(50) NOT NULL,
    
    -- Property and Ownership Details
    property_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    
    -- Tenancy Details
    floor_id BIGINT,
    room_id BIGINT,
    bed_id BIGINT,
    flat_id BIGINT,
    
    -- Financial Information
    rent_amount DECIMAL(10, 2),
    security_deposit DECIMAL(10, 2),
    advance_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Tenancy Period
    move_in_date DATE NOT NULL,
    move_out_date DATE NOT NULL,
    lease_duration_months INT,
    
    -- Status and Reason
    vacate_reason VARCHAR(500),
    final_settlement_amount DECIMAL(10, 2) DEFAULT 0.00,
    security_deposit_returned DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Timestamps
    tenancy_start_date TIMESTAMP NOT NULL,
    tenancy_end_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL,
    
    -- Indexes for better query performance
    INDEX idx_phone_number (phone_number),
    INDEX idx_property_id (property_id),
    INDEX idx_owner_id (owner_id),
    INDEX idx_move_out_date (move_out_date),
    INDEX idx_tenancy_period (tenancy_start_date, tenancy_end_date)
);