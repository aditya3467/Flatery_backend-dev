-- Debug script to investigate temporary_password NULL issue

-- 1. Check column definitions
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'flatery_db' 
  AND TABLE_NAME = 'tenants' 
  AND COLUMN_NAME IN ('temporary_password', 'password_changed');

-- 2. Check all tenant records
SELECT 
    id,
    tenant_id,
    phone_number,
    temporary_password,
    password_changed,
    status,
    created_at
FROM tenants
ORDER BY created_at DESC;

-- 3. Check corresponding users for those tenants
SELECT 
    u.id,
    u.username,
    u.phone_number,
    u.role,
    u.created_at,
    t.tenant_id,
    t.temporary_password AS tenant_temp_pass,
    t.password_changed AS tenant_pass_changed
FROM users u
LEFT JOIN tenants t ON u.phone_number = t.phone_number
WHERE u.role = 'TENANT'
ORDER BY u.created_at DESC;

-- 4. Fix password_changed default if needed (run this only if default is wrong)
-- ALTER TABLE tenants MODIFY COLUMN password_changed BOOLEAN NOT NULL DEFAULT 0;
