-- Add status column to properties table with default value ACTIVE

ALTER TABLE properties 
ADD COLUMN status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- Update any existing properties to have ACTIVE status
UPDATE properties SET status = 'ACTIVE' WHERE status IS NULL;

-- Create index on status for faster filtering
CREATE INDEX idx_property_status ON properties(status);
