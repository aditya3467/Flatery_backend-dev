## Forgot Password with OTP Implementation Guide

### Overview
This document describes the complete implementation of the forgot password feature with OTP-based password reset functionality.

---

## 📋 Table of Contents
1. [Database Schema](#database-schema)
2. [Backend Components](#backend-components)
3. [API Endpoints](#api-endpoints)
4. [Email Configuration](#email-configuration)
5. [Frontend Integration](#frontend-integration)
6. [Security Best Practices](#security-best-practices)
7. [Error Handling](#error-handling)

---

## 🗄️ Database Schema

### Table: `password_reset_otp`
```sql
CREATE TABLE password_reset_otp (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_otp (otp),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    
    CONSTRAINT fk_password_reset_otp_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Columns Explanation:**
- `id`: Unique identifier
- `user_id`: References the user entity
- `email`: User's email where OTP was sent
- `otp`: 6-digit numeric OTP
- `expires_at`: OTP expiration timestamp (default: 10 minutes)
- `is_used`: Flag to prevent OTP reuse
- `attempts`: Number of failed attempts (max: 5)
- `created_at`: OTP creation timestamp

---

## 🔧 Backend Components

### 1. Entity Model
**File:** `src/main/java/com/Flatery/model/PasswordResetOtp.java`
- Manages OTP data with validation methods
- `isValid()`: Checks if OTP is not used and not expired
- `hasExceededAttempts()`: Checks max attempt limit
- `canAttempt()`: Combined validation for attempt

### 2. Repository
**File:** `src/main/java/com/Flatery/repository/PasswordResetOtpRepository.java`
- `findLatestValidOtpByEmail()`: Gets the latest unused, non-expired OTP
- `findByEmailAndOtp()`: Finds OTP by email and OTP value
- `deleteExpiredOtps()`: Cleanup query for maintenance
- `countRecentOtpRequestsByEmail()`: Rate limiting support

### 3. Service Layer
**File:** `src/main/java/com/Flatery/service/PasswordResetService.java`

**Key Methods:**
- `generateAndSendOtp(String email)`: Generate OTP and send via email
- `verifyOtpAndResetPassword(String email, String otp, String newPassword)`: Verify OTP and update password
- `isOtpValid(String email)`: Check OTP validity
- `getOtpValidityRemaining(String email)`: Get remaining validity time in seconds

**Configuration Properties:**
```properties
flatery.otp.validity-minutes=10           # OTP valid for 10 minutes
flatery.otp.max-attempts=5                # Max 5 failed attempts
flatery.otp.rate-limit-minutes=1          # Rate limit: 1 OTP per minute
```

### 4. Controller
**File:** `src/main/java/com/Flatery/Controller/auth/PasswordResetController.java`

---

## 🔌 API Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/auth/password-reset/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent to your registered email. It is valid for 10 minutes.",
  "otpValiditySeconds": 600,
  "errorCode": null
}
```

**Response (Rate Limited - 429):**
```json
{
  "success": false,
  "message": "OTP request rate limited. Please try again after 1 minute(s)",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

**Response (User Not Found - 500):**
```json
{
  "success": false,
  "message": "User with email not found: xyz@example.com",
  "errorCode": null
}
```

---

### 2. Reset Password with OTP
**Endpoint:** `POST /api/auth/password-reset/reset-password`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password.",
  "otpValiditySeconds": null,
  "errorCode": null
}
```

**Response (Invalid OTP - 400):**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again.",
  "errorCode": "OTP_VERIFICATION_FAILED"
}
```

**Response (Expired OTP - 400):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP.",
  "errorCode": "OTP_VERIFICATION_FAILED"
}
```

**Response (Max Attempts Exceeded - 400):**
```json
{
  "success": false,
  "message": "Maximum OTP attempts exceeded. Please request a new OTP.",
  "errorCode": "OTP_VERIFICATION_FAILED"
}
```

**Response (Password Mismatch - 400):**
```json
{
  "success": false,
  "message": "Passwords do not match",
  "errorCode": "PASSWORD_MISMATCH"
}
```

---

### 3. Check OTP Validity (Optional)
**Endpoint:** `GET /api/auth/password-reset/otp-validity?email=user@example.com`

**Response (Valid - 200):**
```json
{
  "success": true,
  "message": "OTP is still valid",
  "otpValiditySeconds": 480,
  "errorCode": null
}
```

**Response (Invalid/Expired - 400):**
```json
{
  "success": false,
  "message": "OTP has expired or is invalid. Please request a new OTP.",
  "errorCode": "OTP_INVALID_OR_EXPIRED"
}
```

---

## 📧 Email Configuration

### Email Template
**Template Type:** `OTP_RESET_PASSWORD`

The email includes:
- User's first name
- 6-digit OTP (prominently displayed)
- OTP validity period (10 minutes)
- Security warning not to share OTP
- Professional branding

**Template Placeholders:**
- `{{userName}}`: User's first name
- `{{otp}}`: 6-digit OTP code
- `{{expiryMinutes}}`: OTP validity in minutes

---

## 🎨 Frontend Integration

### Step 1: Create Forgot Password Page
**File:** `frontend/forgot-password.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Forgot Password</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="forgot-password-container">
        <!-- Step 1: Email Entry -->
        <div id="step1-email" class="step">
            <h2>Forgot Password</h2>
            <form id="emailForm">
                <input type="email" id="email" placeholder="Enter your registered email" required>
                <button type="submit">Send OTP</button>
            </form>
            <p id="step1Message" class="message"></p>
        </div>

        <!-- Step 2: OTP Entry -->
        <div id="step2-otp" class="step hidden">
            <h2>Enter OTP</h2>
            <p>We've sent a 6-digit OTP to <strong id="displayEmail"></strong></p>
            
            <!-- OTP Input with 6 boxes -->
            <div class="otp-input-container">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
                <input type="text" class="otp-box" maxlength="1" pattern="\d" inputmode="numeric">
            </div>

            <p class="timer">OTP expires in: <span id="countdown">600</span> seconds</p>

            <form id="otpForm">
                <input type="hidden" id="otpValue">
                <button type="submit">Verify OTP</button>
            </form>

            <button type="button" id="resendBtn" disabled>Resend OTP (in 60s)</button>
            <p id="step2Message" class="message"></p>
        </div>

        <!-- Step 3: New Password -->
        <div id="step3-password" class="step hidden">
            <h2>Set New Password</h2>
            <form id="passwordForm">
                <input type="password" id="newPassword" placeholder="New password" required>
                <input type="password" id="confirmPassword" placeholder="Confirm password" required>
                <button type="submit">Reset Password</button>
            </form>
            <p id="step3Message" class="message"></p>
        </div>
    </div>

    <script src="javascript/forgot-password.js"></script>
</body>
</html>
```

### Step 2: Create JavaScript Handler
**File:** `frontend/javascript/forgot-password.js`

```javascript
const apiBaseUrl = 'http://localhost:8081/api/auth/password-reset';
let userEmail = '';
let otpTimer = null;
let remainingTime = 0;

// Step 1: Send OTP
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    userEmail = document.getElementById('email').value;

    try {
        const response = await fetch(`${apiBaseUrl}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const data = await response.json();

        if (data.success) {
            // Show OTP step
            document.getElementById('step1-email').classList.add('hidden');
            document.getElementById('step2-otp').classList.remove('hidden');
            document.getElementById('displayEmail').textContent = userEmail;

            remainingTime = data.otpValiditySeconds || 600;
            startOtpTimer();
            setupOtpInput();
        } else {
            showMessage('step1Message', data.message, 'error');
        }
    } catch (error) {
        showMessage('step1Message', 'Error sending OTP', 'error');
    }
});

// OTP Input Handler
function setupOtpInput() {
    const otpBoxes = document.querySelectorAll('.otp-box');

    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            if (e.target.value) {
                if (index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                }
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });
}

// Get OTP Value
function getOtpValue() {
    const otpBoxes = document.querySelectorAll('.otp-box');
    return Array.from(otpBoxes).map(box => box.value).join('');
}

// OTP Timer
function startOtpTimer() {
    document.getElementById('countdown').textContent = remainingTime;

    otpTimer = setInterval(() => {
        remainingTime--;
        document.getElementById('countdown').textContent = remainingTime;

        if (remainingTime <= 0) {
            clearInterval(otpTimer);
            showMessage('step2Message', 'OTP expired. Please request a new OTP.', 'error');
        }
    }, 1000);
}

// Step 2: Verify OTP
document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = getOtpValue();

    if (otp.length !== 6) {
        showMessage('step2Message', 'Please enter a valid 6-digit OTP', 'error');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                otp: otp,
                newPassword: '', // Will be set in next step
                confirmPassword: ''
            })
        });

        const data = await response.json();

        if (data.success) {
            // Move to password reset step
            document.getElementById('step2-otp').classList.add('hidden');
            document.getElementById('step3-password').classList.remove('hidden');
            clearInterval(otpTimer);
        } else {
            showMessage('step2Message', data.message, 'error');
        }
    } catch (error) {
        showMessage('step2Message', 'Error verifying OTP', 'error');
    }
});

// Step 3: Reset Password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const otp = getOtpValue();

    if (newPassword !== confirmPassword) {
        showMessage('step3Message', 'Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                otp: otp,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('step3Message', 'Password reset successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = '/frontend/login.html';
            }, 2000);
        } else {
            showMessage('step3Message', data.message, 'error');
        }
    } catch (error) {
        showMessage('step3Message', 'Error resetting password', 'error');
    }
});

// Resend OTP
document.getElementById('resendBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${apiBaseUrl}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const data = await response.json();

        if (data.success) {
            // Reset OTP input
            document.querySelectorAll('.otp-box').forEach(box => box.value = '');
            
            remainingTime = data.otpValiditySeconds || 600;
            clearInterval(otpTimer);
            startOtpTimer();

            showMessage('step2Message', 'New OTP sent successfully!', 'success');
        } else {
            showMessage('step2Message', data.message, 'error');
        }
    } catch (error) {
        showMessage('step2Message', 'Error resending OTP', 'error');
    }
});

// Helper function
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}
```

### Step 3: Add CSS Styling
**File:** `frontend/css/forgot-password.css`

```css
.forgot-password-container {
    max-width: 500px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.step {
    display: block;
}

.step.hidden {
    display: none;
}

.otp-input-container {
    display: flex;
    gap: 10px;
    margin: 20px 0;
    justify-content: center;
}

.otp-box {
    width: 50px;
    height: 50px;
    font-size: 24px;
    text-align: center;
    border: 2px solid #ddd;
    border-radius: 8px;
    transition: border-color 0.3s;
}

.otp-box:focus {
    border-color: #007bff;
    outline: none;
}

.timer {
    text-align: center;
    color: #666;
    margin: 15px 0;
}

#resendBtn {
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

#resendBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.message {
    margin-top: 15px;
    padding: 10px;
    border-radius: 4px;
}

.message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}
```

---

## 🔐 Security Best Practices

### Implemented:
1. **OTP Expiration**: 10 minutes validity (configurable)
2. **Rate Limiting**: 1 OTP per minute per email
3. **Attempt Limiting**: Max 5 failed attempts
4. **Single Use**: OTP marked as used after successful verification
5. **Database Cleanup**: Expired OTPs deleted hourly
6. **Secure Random Generation**: 6-digit numeric OTP using SecureRandom
7. **Password Encryption**: New password hashed with PasswordEncoder
8. **Email Verification**: Email must exist in system

### Additional Recommendations:
1. Hash OTP before storing (optional, already in DB)
2. Use HTTPS for all endpoints
3. Implement CSRF protection
4. Add email verification for new accounts
5. Log all password reset attempts for audit
6. Implement account lockout after max failures

---

## ❌ Error Handling

| Error | HTTP Status | Error Code | Action |
|-------|------------|-----------|--------|
| Email not found | 500 | - | Suggest account creation |
| Rate limited | 429 | RATE_LIMIT_EXCEEDED | Show retry timer |
| OTP expired | 400 | OTP_VERIFICATION_FAILED | Offer resend OTP |
| Invalid OTP | 400 | OTP_VERIFICATION_FAILED | Show remaining attempts |
| Max attempts exceeded | 400 | OTP_VERIFICATION_FAILED | Force new OTP request |
| Password mismatch | 400 | PASSWORD_MISMATCH | Highlight both fields |

---

## 🚀 Deployment Checklist

- [ ] Update email template in database using migration
- [ ] Configure OTP properties in `application.properties`
- [ ] Enable email service configuration
- [ ] Test with actual email service
- [ ] Create frontend forgot password page
- [ ] Add link to login page ("Forgot Password?")
- [ ] Test end-to-end flow
- [ ] Monitor scheduler logs
- [ ] Document custom email configuration

---

## 📞 Support & Troubleshooting

### OTP not received
- Check email configuration in `application.properties`
- Verify email template is active in database
- Check spam folder
- Verify email service connectivity

### Rate limiting too strict
- Adjust `flatery.otp.rate-limit-minutes` in config
- Default: 1 minute (change to 0.5 for 30 seconds, 2 for 2 minutes)

### OTP expiring too quickly
- Adjust `flatery.otp.validity-minutes` in config
- Default: 10 minutes

### Database cleanup not running
- Verify `@EnableScheduling` is on main Application class
- Check scheduler logs in application logs
- Verify database has write permissions

