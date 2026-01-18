# SMTP Setup Guide for Password Reset Feature

## Overview

The forgotten password feature uses SMTP emails configured via the **SuperAdmin panel**. SMTP credentials are stored securely in the database, **not** in `application.properties`.

---

## Quick Start (3 Steps)

### Step 1: Build & Start the Application
```bash
cd /Users/mac/Documents/GitHub/Flatery_backend-dev
mvn clean spring-boot:run
```

### Step 2: Login as SuperAdmin
- Navigate to: `http://localhost:8081/superadmin-dashboard.html`
- Login with SuperAdmin credentials

### Step 3: Configure Email
1. Go to **Email Configuration** section
2. Click **"Add/Update Email Config"**
3. Fill in SMTP details (see examples below)
4. Click **"Test Email"** to verify
5. Click **"Save Configuration"**

---

## SMTP Configuration Examples

### Gmail (Recommended for Testing)

```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-specific-password  ⚠️ NOT your regular Gmail password!
From Email: noreply@flatery.com
From Name: Flatery
Reply To: support@flatery.com
Encryption: TLS
```

**How to get Gmail App Password**:
1. Enable 2-factor authentication on Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Generate and copy the 16-character password
5. Use this password in SMTP configuration (spaces are optional)

---

### Mailtrap (Best for Local Development)

```
Host: live.smtp.mailtrap.io
Port: 465
Username: api
Password: your-mailtrap-api-token
From Email: hello@flatery.com
From Name: Flatery
Encryption: SSL
```

**Why Mailtrap**:
- ✅ Free tier includes 500 emails/month
- ✅ No actual emails sent (trapped in UI)
- ✅ Test emails before going to production
- ✅ Get API credentials from https://mailtrap.io

---

### SendGrid

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.your-sendgrid-api-key
From Email: noreply@flatery.com
From Name: Flatery
Encryption: TLS
```

---

### AWS SES

```
Host: email-smtp.ap-south-1.amazonaws.com  (or your region)
Port: 587
Username: your-ses-smtp-username
Password: your-ses-smtp-password
From Email: verified-email@your-domain.com
From Name: Flatery
Encryption: TLS
```

---

## API Endpoints for Email Configuration

### 1. Get Current Configuration
```bash
curl -X GET http://localhost:8081/api/superadmin/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "your-email@gmail.com",
  "fromEmail": "noreply@flatery.com",
  "fromName": "Flatery",
  "replyTo": "support@flatery.com",
  "encryption": "TLS",
  "enabled": true,
  "paused": false
}
```

### 2. Create/Update Configuration
```bash
curl -X POST http://localhost:8081/api/superadmin/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "fromEmail": "noreply@flatery.com",
    "fromName": "Flatery",
    "replyTo": "support@flatery.com",
    "encryption": "TLS",
    "enabled": true,
    "paused": false
  }'
```

### 3. Test Email Configuration
```bash
curl -X POST http://localhost:8081/api/superadmin/email/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email from Flatery"
  }'
```

### 4. Update Specific Fields
```bash
curl -X PATCH http://localhost:8081/api/superadmin/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "new-from-email@flatery.com",
    "enabled": true
  }'
```

### 5. Toggle Email On/Off
```bash
# Temporarily pause all emails
curl -X PATCH http://localhost:8081/api/superadmin/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paused": true}'

# Resume emails
curl -X PATCH http://localhost:8081/api/superadmin/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paused": false}'
```

---

## Testing the Forgot Password Flow

### 1. Request Password Reset
```bash
curl -X POST http://localhost:8081/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent to email. Valid for 10 minutes.",
  "otpValiditySeconds": 600
}
```

### 2. Check Mailtrap/Email Service for OTP
- For Mailtrap: Check https://mailtrap.io/inbox
- For Gmail: Check spam folder if not in inbox
- For production: Check actual email account

### 3. Verify OTP and Reset Password
```bash
curl -X POST http://localhost:8081/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewSecurePassword123!",
    "confirmPassword": "NewSecurePassword123!"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 4. Check OTP Validity (Optional)
```bash
curl -X GET "http://localhost:8081/api/auth/otp-validity?email=user@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "valid": true,
  "secondsRemaining": 480
}
```

---

## Troubleshooting

### ❌ "Failed to send email"
**Check**:
1. Is email service enabled?
   ```sql
   SELECT enabled, paused FROM email_config WHERE id = 1;
   ```
   - If `enabled = false`, enable it via SuperAdmin panel
   - If `paused = true`, resume it via SuperAdmin panel

2. Is SMTP configuration valid?
   - Use "Send Test Email" button in SuperAdmin
   - Check application logs: `tail -f logs/application.log | grep -i email`

3. Check network connectivity to SMTP server
   ```bash
   telnet smtp.gmail.com 587
   ```
   - If connection refused, check firewall

### ❌ "Incorrect SMTP Credentials"
- Verify credentials in SuperAdmin panel
- For Gmail: Use App Password, not regular password
- For Mailtrap: Use API token as password
- For other services: Copy credentials exactly (no extra spaces)

### ❌ "530 Authentication Failed"
- Check username/email is correct
- Check password is correct
- Verify username format (some services require full email)

### ❌ "TLS not available"
- Change port from 587 to 465 (SSL)
- Or try different encryption method
- Verify firewall allows outbound on that port

### ❌ "Timeout connecting to SMTP"
- Check host is correct
- Verify port is correct (typically 587 or 465)
- Check internet connectivity: `ping smtp.gmail.com`
- Try different SMTP service (Mailtrap for testing)

### ❌ "OTP not received after 5+ minutes"
- Check email spam/junk folder
- Verify test email works (click "Test Email" in SuperAdmin)
- Check email service isn't paused
- Check OTP hasn't expired (10 minutes validity)

---

## Database Tables Involved

### 1. email_config
Stores SMTP configuration:
```sql
SELECT * FROM email_config;
```

| Column | Type | Notes |
|--------|------|-------|
| `host` | VARCHAR | SMTP server hostname |
| `port` | INT | SMTP port (587 or 465) |
| `username` | VARCHAR | SMTP username |
| `encrypted_password` | VARCHAR | Encrypted password (AES-GCM) |
| `from_email` | VARCHAR | From address |
| `from_name` | VARCHAR | From name |
| `reply_to` | VARCHAR | Reply-to address |
| `encryption` | VARCHAR | TLS or SSL |
| `enabled` | BOOLEAN | Enable/disable service |
| `paused` | BOOLEAN | Pause without losing config |

### 2. password_reset_otp
Stores generated OTPs:
```sql
SELECT * FROM password_reset_otp WHERE email = 'user@example.com' ORDER BY created_at DESC;
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT | Primary key |
| `user_id` | BIGINT | Foreign key to users |
| `email` | VARCHAR | Email address |
| `otp` | VARCHAR | 6-digit OTP |
| `expires_at` | DATETIME | When OTP expires (10 min) |
| `is_used` | BOOLEAN | Mark OTP as used |
| `attempts` | INT | Failed attempts count |
| `created_at` | TIMESTAMP | When OTP was created |

### 3. email_templates
Stores email templates:
```sql
SELECT * FROM email_templates WHERE template_key = 'OTP_RESET_PASSWORD';
```

Update OTP email template:
```sql
UPDATE email_templates
SET html_body = 'Your new HTML template here',
    text_body = 'Your new text template here',
    updated_at = NOW()
WHERE template_key = 'OTP_RESET_PASSWORD';
```

---

## Monitoring & Debugging

### View Application Logs
```bash
# Real-time logs
tail -f logs/application.log

# Filter for email logs
tail -f logs/application.log | grep -i email

# Filter for password reset logs
tail -f logs/application.log | grep -i "password\|otp"
```

### Check Email Queue (If Async)
```sql
-- View queued emails
SELECT id, recipient, status, created_at FROM email_queue 
WHERE status != 'SENT' 
ORDER BY created_at DESC;

-- View email logs
SELECT id, recipient, template_key, sent_at FROM email_log 
ORDER BY sent_at DESC 
LIMIT 20;
```

### Verify OTP Generation
```sql
-- Check latest OTP for user
SELECT user_id, email, otp, expires_at, is_used, attempts
FROM password_reset_otp
WHERE email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check OTP expiration timing
SELECT 
  otp,
  created_at,
  expires_at,
  TIMESTAMPDIFF(SECOND, NOW(), expires_at) as seconds_remaining
FROM password_reset_otp
WHERE email = 'user@example.com'
  AND is_used = 0
ORDER BY created_at DESC
LIMIT 1;
```

---

## Security Best Practices

✅ **Use App-Specific Passwords**
- Never use your main account password
- Gmail: Use 16-character app password from myaccount.google.com/apppasswords

✅ **Encryption**
- SMTP password encrypted before storage (AES-GCM)
- Database credentials never exposed in config files

✅ **Rate Limiting**
- Maximum 1 OTP request per minute per email
- Maximum 5 failed attempts per OTP
- OTPs expire after 10 minutes

✅ **Audit Trail**
- All email sends logged in email_log table
- Track sent, failed, and bounced emails
- Monitor from SuperAdmin dashboard

✅ **Access Control**
- Only SUPERADMIN can configure email settings
- Regular users can only request password reset
- API endpoints protected with JWT authentication

---

## Production Deployment Checklist

- [ ] Use production-grade SMTP service (SendGrid, AWS SES, not Gmail)
- [ ] Configure proper "From" and "Reply-To" addresses
- [ ] Enable DKIM/SPF records for domain (reduce spam)
- [ ] Test with production email account before going live
- [ ] Set up email monitoring/alerting for failures
- [ ] Configure email rate limits appropriate for traffic
- [ ] Back up email configuration before deploying
- [ ] Monitor email logs regularly
- [ ] Set up SSL certificate for secure connections
- [ ] Use strong encryption secret for SMTP passwords

---

## Related Documentation

- [EMAIL_SETUP.md](EMAIL_SETUP.md) - Email infrastructure overview
- [FORGOT_PASSWORD_IMPLEMENTATION.md](FORGOT_PASSWORD_IMPLEMENTATION.md) - Implementation details
- [PASSWORD_RESET_DATABASE_SCHEMA.md](PASSWORD_RESET_DATABASE_SCHEMA.md) - Database schema
- [FORGOT_PASSWORD_TESTING.md](FORGOT_PASSWORD_TESTING.md) - Testing procedures

---

**Last Updated**: January 17, 2026  
**Status**: ✅ Ready for Configuration
