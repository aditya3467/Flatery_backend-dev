-- ================================================
-- DIAGNOSTIC: Check why password wasn't generated
-- ================================================
-- Run this to see if phone number 1234567876 already exists in users table

USE flatery_db;

-- Check if this phone number exists in users table
SELECT id, username, first_name, phone_number, email, created_at 
FROM users 
WHERE phone_number = '1234567876' OR phone_number = '+911234567876';

-- If you see results above, that's the problem!
-- The system linked to that existing user instead of creating a new one

-- To force creation of a NEW user with password:
-- Option 1: Use a different phone number that doesn't exist
-- Option 2: Delete the existing user first (if safe):
--   DELETE FROM users WHERE phone_number = '1234567876';
--   DELETE FROM tenants WHERE phone_number = '1234567876';

-- Check email_config table (SMTP settings)
SELECT * FROM email_config WHERE is_active = 1;

-- Check if email templates were created
SELECT template_key, active FROM email_templates;

-- Check email queue for pending emails
SELECT id, recipient, subject, status, attempts, last_error 
FROM email_queue 
ORDER BY created_at DESC 
LIMIT 10;
