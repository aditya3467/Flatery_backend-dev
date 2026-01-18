# Quick Reference - Forgot Password API

## TL;DR

✅ **Backend**: Complete and compiled successfully  
✅ **Database**: Migrations ready (V9, V10)  
✅ **Email**: Integrated with existing SuperAdmin SMTP config  
✅ **API**: 3 endpoints ready to use  

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/password-reset/forgot-password` | Send OTP to email |
| POST | `/api/auth/password-reset/reset-password` | Verify OTP & reset password |
| GET | `/api/auth/password-reset/otp-validity?email=...` | Check OTP validity |

---

## Quick Test

### 1. Request OTP
```bash
curl -X POST http://localhost:8081/api/auth/password-reset/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your registered email. It is valid for 10 minutes.",
  "otpValiditySeconds": 600
}
```

### 2. Get OTP from Email (or Mailtrap)

### 3. Reset Password
```bash
curl -X POST http://localhost:8081/api/auth/password-reset/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "otp":"123456",
    "newPassword":"NewPassword123!",
    "confirmPassword":"NewPassword123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

---

## Configuration

### SMTP Setup (SuperAdmin Panel)
1. Go to: `http://localhost:8081/superadmin-dashboard.html`
2. Navigate to: **Email Configuration**
3. Enter SMTP details:
   - **For Testing**: Use Mailtrap.io (free)
   - **For Production**: Use SendGrid, AWS SES, or Gmail App Password
4. Click "Send Test Email" to verify
5. Click "Save Configuration"

### OTP Settings (application.properties)
```properties
flatery.otp.validity-minutes=10          # OTP expires after 10 minutes
flatery.otp.max-attempts=5               # Max 5 failed attempts
flatery.otp.rate-limit-minutes=1         # Max 1 request per minute
```

---

## Security Features

| Feature | Details |
|---------|---------|
| **Rate Limiting** | Max 1 OTP per minute per email |
| **Attempt Limiting** | Max 5 failed attempts per OTP |
| **Expiration** | OTP valid for 10 minutes |
| **Encryption** | SMTP password encrypted (AES-GCM) |
| **Auto Cleanup** | Expired OTPs deleted hourly |
| **Password Hashing** | BCrypt used for new passwords |

---

## Database Tables

### password_reset_otp
```sql
SELECT * FROM password_reset_otp 
WHERE email = 'user@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

Columns:
- `id` - Primary key
- `user_id` - Foreign key to users
- `email` - Email address
- `otp` - 6-digit code
- `expires_at` - Expiration time
- `is_used` - Usage flag
- `attempts` - Failed attempt count

### email_config
```sql
SELECT * FROM email_config WHERE id = 1;
```

SMTP credentials (password encrypted).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Email not sent** | Check SMTP config in SuperAdmin (use "Send Test Email" button) |
| **OTP not received** | Check spam folder, verify email service is enabled and not paused |
| **Rate limit error (429)** | Wait 1 minute before requesting new OTP |
| **Max attempts exceeded** | Request new OTP |
| **OTP expired** | Request new OTP (expires after 10 min) |
| **Build failed** | Ensure `APP_ENCRYPTION_SECRET` env var is set (optional, has default) |

---

## Files Created

| File | Type | Location |
|------|------|----------|
| PasswordResetOtp.java | Entity | src/main/java/com/Flatery/model/ |
| PasswordResetOtpRepository.java | Repository | src/main/java/com/Flatery/repository/ |
| PasswordResetService.java | Service | src/main/java/com/Flatery/service/ |
| PasswordResetController.java | Controller | src/main/java/com/Flatery/Controller/auth/ |
| ForgotPasswordRequest.java | DTO | src/main/java/com/Flatery/dto/ |
| ResetPasswordRequest.java | DTO | src/main/java/com/Flatery/dto/ |
| PasswordResetResponse.java | DTO | src/main/java/com/Flatery/dto/ |
| PasswordResetOtpCleanupScheduler.java | Scheduler | src/main/java/com/Flatery/scheduler/ |
| V9__Create_password_reset_otp_table.sql | Migration | src/main/resources/db/migration/ |
| V10__Insert_otp_email_template.sql | Migration | src/main/resources/db/migration/ |

---

## Documentation

| Document | Purpose |
|----------|---------|
| SMTP_SETUP_GUIDE.md | SMTP configuration & troubleshooting |
| FORGOT_PASSWORD_IMPLEMENTATION.md | Full implementation details |
| PASSWORD_RESET_DATABASE_SCHEMA.md | Database schema & queries |
| FORGOT_PASSWORD_TESTING.md | Testing procedures |
| IMPLEMENTATION_CHECKLIST.md | Deployment checklist |
| FORGOT_PASSWORD_DEPLOYMENT_STATUS.md | Build status & next steps |

---

## Mailtrap Setup (For Testing)

1. Go to https://mailtrap.io
2. Sign up (free tier available)
3. Get SMTP credentials:
   ```
   Host: live.smtp.mailtrap.io
   Port: 465
   Username: api
   Password: [Your Mailtrap API token from dashboard]
   Encryption: SSL
   ```
4. Enter in SuperAdmin Email Configuration
5. All emails will be captured in Mailtrap inbox (no actual emails sent)

---

## Production SMTP Providers

### Gmail (Simple but Limited)
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [16-char App Password from myaccount.google.com/apppasswords]
Encryption: TLS
```

### SendGrid (Recommended)
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: SG.[Your SendGrid API key]
Encryption: TLS
```

### AWS SES
```
Host: email-smtp.ap-south-1.amazonaws.com
Port: 587
Username: [SES SMTP username]
Password: [SES SMTP password]
Encryption: TLS
```

---

## Build & Run

```bash
# Clean and compile
mvn clean compile

# Build JAR
mvn clean package -DskipTests

# Run development
mvn clean spring-boot:run

# Run production
java -jar target/flatery.backenddd-0.0.1-SNAPSHOT.jar
```

---

## API Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | Success | OTP sent / Password reset |
| **400** | Bad request | Invalid email, OTP, or password |
| **429** | Too many requests | Rate limited (1 per minute) |
| **500** | Server error | Email sending failed |

---

## Next Steps

1. **Configure SMTP** in SuperAdmin panel (use Mailtrap for testing)
2. **Test API endpoints** with curl or Postman
3. **Implement frontend** forgot-password UI
4. **Run full QA** using testing guide
5. **Deploy to production** with proper SMTP provider

---

**Status**: ✅ Ready to use  
**Build**: ✅ Success  
**Build Date**: January 17, 2026
