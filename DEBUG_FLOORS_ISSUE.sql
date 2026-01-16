-- Debug script for floors/units loading issue

-- 1. Check which properties exist
SELECT 
    id,
    property_name,
    property_type,
    owner_id,
    status,
    created_at
FROM properties
ORDER BY id;

-- 2. Check floors for each property
SELECT 
    f.id AS floor_id,
    f.property_id,
    f.number AS floor_number,
    f.name AS floor_name,
    f.sort_index,
    p.property_name,
    p.property_type,
    p.owner_id
FROM floors f
INNER JOIN properties p ON f.property_id = p.id
ORDER BY f.property_id, f.number;

-- 3. Check units for each floor
SELECT 
    u.id AS unit_id,
    u.floor_id,
    u.number AS unit_number,
    u.name AS unit_name,
    f.number AS floor_number,
    f.property_id,
    p.property_name
FROM units u
INNER JOIN floors f ON u.floor_id = f.id
INNER JOIN properties p ON f.property_id = p.id
ORDER BY f.property_id, f.number, u.number;

-- 4. Check if there are any PG properties without floors
SELECT 
    p.id,
    p.property_name,
    p.property_type,
    p.owner_id,
    COUNT(f.id) AS floor_count
FROM properties p
LEFT JOIN floors f ON p.id = f.property_id
WHERE p.property_type = 'PG'
GROUP BY p.id, p.property_name, p.property_type, p.owner_id;
