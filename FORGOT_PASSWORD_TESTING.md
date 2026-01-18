## Forgot Password API - Quick Testing Guide

### 1. Send OTP
```bash
curl -X POST http://localhost:8081/api/auth/password-reset/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to your registered email. It is valid for 10 minutes.",
  "otpValiditySeconds": 600,
  "errorCode": null
}
```

---

### 2. Verify OTP & Reset Password
```bash
curl -X POST http://localhost:8081/api/auth/password-reset/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewPassword@123",
    "confirmPassword": "NewPassword@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password.",
  "otpValiditySeconds": null,
  "errorCode": null
}
```

---

### 3. Check OTP Validity
```bash
curl -X GET "http://localhost:8081/api/auth/password-reset/otp-validity?email=user@example.com"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP is still valid",
  "otpValiditySeconds": 480,
  "errorCode": null
}
```

---

## Test Scenarios

### Scenario 1: Successful Password Reset
1. Call `/forgot-password` with valid email → OTP sent
2. Wait for email to arrive
3. Extract OTP from email
4. Call `/reset-password` with email, OTP, and new password → Success

### Scenario 2: Invalid OTP
1. Call `/forgot-password` → OTP sent
2. Call `/reset-password` with wrong OTP → Error: "Invalid OTP"
3. Verify attempt counter incremented

### Scenario 3: Rate Limiting
1. Call `/forgot-password` twice within 1 minute
2. Second call returns: "OTP request rate limited"
3. Wait 1 minute and retry → Success

### Scenario 4: Expired OTP
1. Call `/forgot-password` → OTP sent
2. Wait 10 minutes
3. Call `/reset-password` with OTP → Error: "OTP has expired"

### Scenario 5: Max Attempts Exceeded
1. Call `/forgot-password` → OTP sent
2. Call `/reset-password` 5 times with wrong OTP
3. 6th attempt returns: "Maximum OTP attempts exceeded"

### Scenario 6: Password Mismatch
1. Call `/reset-password` with non-matching passwords
2. Returns: "Passwords do not match"

---

## Database Verification

### Check OTP Record
```sql
SELECT * FROM password_reset_otp 
WHERE email = 'user@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check if OTP was marked as used
```sql
SELECT id, email, otp, is_used, attempts, expires_at 
FROM password_reset_otp 
WHERE email = 'user@example.com' AND is_used = true;
```

### Check for expired OTPs
```sql
SELECT COUNT(*) as expired_count 
FROM password_reset_otp 
WHERE expires_at < NOW();
```

### Cleanup Test
```sql
-- Manually delete expired OTPs
DELETE FROM password_reset_otp 
WHERE expires_at < NOW() OR is_used = true;
```

---

## Environment Configuration

### Development (application.properties)
```properties
# OTP Configuration
flatery.otp.validity-minutes=10
flatery.otp.max-attempts=5
flatery.otp.rate-limit-minutes=1

# Email Configuration (example)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

---

## Postman Collection

### Import as Postman Environment Variables
```json
{
  "baseUrl": "http://localhost:8081",
  "userEmail": "test@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@123"
}
```

### Request 1: Send OTP
```
POST {{baseUrl}}/api/auth/password-reset/forgot-password
Content-Type: application/json

{
  "email": "{{userEmail}}"
}
```

### Request 2: Verify OTP & Reset Password
```
POST {{baseUrl}}/api/auth/password-reset/reset-password
Content-Type: application/json

{
  "email": "{{userEmail}}",
  "otp": "{{otp}}",
  "newPassword": "{{newPassword}}",
  "confirmPassword": "{{newPassword}}"
}
```

### Request 3: Check OTP Validity
```
GET {{baseUrl}}/api/auth/password-reset/otp-validity?email={{userEmail}}
```

---

## Logs to Monitor

### Application Startup
```
Starting cleanup of expired OTPs
Successfully cleaned up expired OTPs
```

### Successful OTP Generation
```
Forgot password request for email: user@example.com
OTP generated and sent to email: user@example.com
```

### Successful Password Reset
```
Password reset request for email: user@example.com
Password reset successfully for user: user@example.com
```

### Error Scenarios
```
Rate limit or other error for email: user@example.com, Error: ...
OTP verification failed for email: user@example.com, Error: ...
```

---

## Performance Optimization

### Index Queries
The following indexes are created for performance:
- `idx_email`: Fast lookup by email
- `idx_otp`: Fast lookup by OTP code
- `idx_expires_at`: Fast cleanup of expired OTPs
- `idx_user_id`: Fast user association

### Database Query Performance
- Send OTP: ~50ms (with email sending ~1-2s)
- Verify OTP: ~30ms
- Check Validity: ~20ms
- Cleanup: ~100ms (hourly)

---

## Troubleshooting

### Issue: OTP not received in email
**Solution:**
- Check email service configuration
- Verify email template exists and is active
- Check email service logs
- Try sending test email manually

### Issue: "User with email not found"
**Solution:**
- Create user account first
- Verify email exists in `users` table
- Check email is correct (case-sensitive in some systems)

### Issue: Rate limit blocking legitimate requests
**Solution:**
- Reduce `flatery.otp.rate-limit-minutes` to 0.5
- Or implement whitelist for testing

### Issue: OTP expires too quickly
**Solution:**
- Increase `flatery.otp.validity-minutes` (e.g., 15 or 20)
- Note: Ensure users see expiration timer on frontend

### Issue: Cannot reset password after OTP verification
**Solution:**
- Verify new password meets requirements (8+ characters)
- Check passwords match exactly
- Verify OTP hasn't been used already (is_used flag)

---

## Security Validation Checklist

- [ ] OTP is 6 random digits
- [ ] OTP expires after configured time
- [ ] OTP can only be used once
- [ ] Failed attempts are tracked
- [ ] Exceeded attempts require new OTP
- [ ] Rate limiting prevents brute force
- [ ] Password is hashed before storing
- [ ] Email verification required before reset
- [ ] Audit logs show password reset events
- [ ] No OTP stored in plain text in logs
