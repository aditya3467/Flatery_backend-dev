-- Check if OTP was saved
SELECT id, email, otp, expires_at, is_used, attempts, created_at 
FROM password_reset_otp 
ORDER BY created_at DESC 
LIMIT 5;

-- Check email queue status
SELECT id, recipient_email, email_type, status, attempts, scheduled_at, last_error, created_at
FROM email_queue 
WHERE email_type = 'OTP_RESET_PASSWORD'
ORDER BY created_at DESC 
LIMIT 5;

-- Check email logs
SELECT id, email_type, recipient, status, error_message, sent_at, created_at
FROM email_log 
WHERE email_type = 'OTP_RESET_PASSWORD'
ORDER BY created_at DESC 
LIMIT 5;

-- Check if email config exists and is enabled
SELECT id, host, port, username, from_email, is_enabled, is_paused, created_at
FROM email_config
LIMIT 1;

-- Check if email template exists
SELECT id, email_type, subject, is_active
FROM email_template 
WHERE email_type = 'OTP_RESET_PASSWORD';
