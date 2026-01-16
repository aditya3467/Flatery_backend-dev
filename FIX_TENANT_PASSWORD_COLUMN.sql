-- ================================================
-- FIX: Tenant password issues
-- ================================================

USE flatery_db;

-- 1. Check current column definition
SHOW COLUMNS FROM tenants LIKE 'temporary_password';
SHOW COLUMNS FROM tenants LIKE 'password_changed';

-- 2. Fix any default constraint issues
ALTER TABLE tenants MODIFY COLUMN password_changed BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE tenants MODIFY COLUMN temporary_password VARCHAR(120) NULL;

-- 3. Check if any tenants need fixing
SELECT id, tenant_name, phone_number, temporary_password, password_changed 
FROM tenants 
WHERE temporary_password IS NULL 
ORDER BY id DESC 
LIMIT 10;

-- 4. For testing: Delete test tenants and recreate them fresh
-- Uncomment these lines if you want to start fresh with test data:
-- DELETE FROM tenants WHERE phone_number IN ('1234567890', '0987654321', '4567898765', '2345678987');
-- DELETE FROM users WHERE phone_number IN ('1234567890', '0987654321', '4567898765', '2345678987');
