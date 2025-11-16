-- Add primary column to tenancy table to identify primary tenant
-- Primary tenant is responsible for payments and main contact
-- Only one primary tenant allowed per flat

-- Add the primary column with default value 0 (not primary)
ALTER TABLE tenancy 
ADD COLUMN `primary` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Indicates if this is the primary tenant (1) or secondary tenant (0)';

-- Add index for better performance when querying primary tenants
CREATE INDEX idx_tenancy_primary ON tenancy (`primary`);

-- Add composite index for property_id and primary for efficient queries
CREATE INDEX idx_tenancy_property_primary ON tenancy (property_id, `primary`);

-- Update existing tenants to be primary (assuming one tenant per flat currently)
-- This ensures backward compatibility
UPDATE tenancy SET `primary` = 1 WHERE id IN (
    SELECT * FROM (
        SELECT MIN(id) 
        FROM tenancy 
        GROUP BY property_id
    ) AS temp
);

-- Add constraint to ensure only one primary tenant per property
-- Note: MySQL doesn't support partial unique indexes directly, 
-- so we'll handle this constraint at application level