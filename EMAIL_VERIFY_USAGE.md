# How to Use the Email Verification Feature

## Quick Start

### Step 1: Configure Your SMTP Settings
1. Go to Superadmin Dashboard > Email Settings & Templates
2. Fill in all SMTP configuration fields:
   - Provider: SMTP
   - Host: (e.g., smtp.gmail.com)
   - Port: (e.g., 587 for TLS, 465 for SSL)
   - Encryption: TLS or SSL
   - Username: Your email address
   - Password: Your app password or SMTP password
   - From Name: Your preferred sender name
   - From Email: Email to send from
   - Reply-To: (optional) Reply address

### Step 2: Save Configuration
- Click the "Save" button
- Wait for confirmation: "Saved."

### Step 3: Verify Credentials (NEW)
- Click the "Verify Credentials" button
- This will test the connection to your SMTP server

**If successful:**
```
✓ Email credentials verified successfully
```

**If failed:**
You'll see an error like:
- "SMTP Host is not configured"
- "SMTP connection failed: Connection refused"
- "SMTP connection failed: Authentication failed"

### Step 4: Send Test Email
Once verified, send a test email:
1. Enter a test recipient email address
2. Click "Send Test" button
3. The system will:
   - Re-verify credentials automatically
   - Send the test email if verification passes
   - Show result: "Test email sent successfully to test@example.com"

## Common Issues & Solutions

### "SMTP connection failed: Authentication failed"
- Check username and password are correct
- For Gmail: Use an App Password (not your regular password)
- For other providers: Check if you need to enable less secure apps

### "SMTP connection failed: Connection refused"
- Verify SMTP Host and Port are correct
- Check firewall/network allows outbound SMTP connections
- Try port 587 (TLS) or 465 (SSL)

### "SMTP connection failed: Operation timed out"
- SMTP Host may be incorrect
- Network connectivity issue
- Firewall is blocking the connection

### "Password is required for initial setup"
- You must provide a password on first configuration
- Leave password field blank on updates to keep existing password

## Verification Endpoint Details

### Request
```
POST /api/superadmin/email/config/verify
Authorization: Bearer <token>
```

### Response (Success)
```json
{
  "status": "success",
  "message": "Email credentials verified successfully",
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "your@gmail.com"
}
```

### Response (Error)
```json
{
  "status": "error",
  "message": "SMTP connection failed: Authentication failed"
}
```

## Security Notes
- Passwords are encrypted in the database
- Verification only tests connection, doesn't store any test data
- SMTP password is decrypted only during verification/sending
- All operations require SUPERADMIN role
