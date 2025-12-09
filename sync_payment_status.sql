-- Step 1: Normalize payment_month format in transactions to YYYY-MM
UPDATE transactions 
SET payment_month = DATE_FORMAT(STR_TO_DATE(payment_month, '%M %Y'), '%Y-%m')
WHERE payment_month LIKE '%December%' OR payment_month LIKE '%January%' OR payment_month LIKE '%February%' 
   OR payment_month LIKE '%March%' OR payment_month LIKE '%April%' OR payment_month LIKE '%May%' 
   OR payment_month LIKE '%June%' OR payment_month LIKE '%July%' OR payment_month LIKE '%August%' 
   OR payment_month LIKE '%September%' OR payment_month LIKE '%October%' OR payment_month LIKE '%November%';

-- Step 2: Normalize any date formats like YYYY-MM-DD to YYYY-MM
UPDATE transactions 
SET payment_month = SUBSTRING(payment_month, 1, 7)
WHERE LENGTH(payment_month) = 10 AND payment_month LIKE '____-__-__';

-- Step 3: Sync tenant_monthly_payment_status table from existing VERIFIED transactions
INSERT INTO tenant_monthly_payment_status (tenant_id, property_id, payment_month, is_paid, marked_paid_date, marked_by, created_at, updated_at)
SELECT 
    t.tenant_id,
    t.property_id,
    t.payment_month,
    1 as is_paid,
    t.payment_date as marked_paid_date,
    CONCAT('transaction-', t.id) as marked_by,
    NOW() as created_at,
    NOW() as updated_at
FROM transactions t
WHERE t.status = 'VERIFIED'
  AND NOT EXISTS (
      SELECT 1 FROM tenant_monthly_payment_status tmps
      WHERE tmps.tenant_id = t.tenant_id 
      AND tmps.payment_month = t.payment_month
  );

-- Show results
SELECT 
    tmps.id,
    tmps.tenant_id,
    ten.tenant_name,
    tmps.payment_month,
    tmps.is_paid,
    tmps.marked_paid_date,
    tmps.marked_by
FROM tenant_monthly_payment_status tmps
JOIN tenancy ten ON tmps.tenant_id = ten.id
ORDER BY tmps.id DESC
LIMIT 20;
