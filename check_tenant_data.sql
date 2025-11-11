-- Check tenant data for missing owner_id or property_id
SELECT 
    id,
    tenant_id,
    tenant_name,
    phone_number,
    owner_id,
    property_id,
    status
FROM tenancy
WHERE status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 10;

-- Count tenants with missing owner_id or property_id
SELECT 
    COUNT(*) as total_active_tenants,
    SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as missing_owner_id,
    SUM(CASE WHEN property_id IS NULL THEN 1 ELSE 0 END) as missing_property_id
FROM tenancy
WHERE status = 'ACTIVE';
