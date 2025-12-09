-- Manually create payment and payment status for tenant "fuck" (ID 6)
-- This will mark December 2025 as paid and fix the due date calculation

-- Insert transaction
INSERT INTO transactions (tenant_id, owner_id, property_id, amount, payment_month, payment_mode, status, payment_date, created_by, updated_by, created_at, updated_at)
SELECT 
    6 as tenant_id,
    owner_id,
    property_id,
    rent_amount as amount,
    '2025-12' as payment_month,
    'CASH' as payment_mode,
    'VERIFIED' as status,
    NOW() as payment_date,
    CONCAT('owner-', owner_id) as created_by,
    CONCAT('owner-', owner_id) as updated_by,
    NOW() as created_at,
    NOW() as updated_at
FROM tenancy 
WHERE id = 6;

-- Insert payment status
INSERT INTO tenant_monthly_payment_status (tenant_id, property_id, payment_month, is_paid, marked_paid_date, marked_by, created_at, updated_at)
SELECT 
    6 as tenant_id,
    property_id,
    '2025-12' as payment_month,
    1 as is_paid,
    NOW() as marked_paid_date,
    'manual-fix' as marked_by,
    NOW() as created_at,
    NOW() as updated_at
FROM tenancy 
WHERE id = 6;

-- Verify the records were created
SELECT 'Transaction created:' as status;
SELECT id, tenant_id, amount, payment_month, status FROM transactions WHERE tenant_id = 6;

SELECT 'Payment status created:' as status;
SELECT id, tenant_id, payment_month, is_paid FROM tenant_monthly_payment_status WHERE tenant_id = 6;
