# Forgot Password Feature - Debugging Guide

## Overview
This document provides step-by-step debugging instructions for the forgot password feature with OTP verification.

## Recent Changes (Latest Fix)

### What Was Changed:
1. **Form Submission Handler** - Changed from `type="submit"` to `type="button"` with direct `onclick` handlers
   - Previous issue: Form was submitting normally despite preventDefault, causing navigation to index.html
   - Fix: Using direct onclick handlers removes form submission behavior entirely
   - Added: `onsubmit="return false;"` as backup prevention

2. **JavaScript Functions** - Removed event listener attachment from DOMContentLoaded
   - Now uses direct onclick handlers on buttons
   - All functions properly handle event.preventDefault()

3. **Console Logging** - Added comprehensive logging for debugging
   - Logs at each step of the OTP flow
   - Logs API response status and data
   - Logs error messages

## Quick Testing Steps

### Step 1: Start the Application
```bash
cd /Users/mac/Documents/GitHub/Flatery_backend-dev
./mvnw spring-boot:run
```

### Step 2: Open Browser and Enable Developer Tools
1. Go to http://localhost:8080 (or your frontend URL)
2. Press F12 to open Developer Tools
3. Go to Console tab (to see logs)
4. Go to Network tab (to see API calls)

### Step 3: Test Forgot Password Flow

#### Test Case 1: Form Submission (Critical Check)
1. Click "Log in" button to open login modal
2. Click "Forgot password?" link
3. **IMPORTANT**: Verify modal stays open (doesn't redirect to index.html)
4. Enter a valid email address from your database
5. Click "Send OTP" button
6. **CRITICAL**: Check these logs in Console:
   - ✅ `handleForgotPasswordEmail called`
   - ✅ `Sending OTP request for email: [your-email]`
   - ✅ `Response status: 200` (or see error status like 400 or 429)
   - ✅ `Response data: {...}`

#### Test Case 2: Check Modal Transition
After clicking "Send OTP":
- **Expected**: Modal shows Step 2 (OTP input form) with email input replaced by OTP input
- **NOT Expected**: Modal closes, redirect to index.html, or error messages appear
- If modal stays on Step 1: Check Console logs to see if there's an error response

#### Test Case 3: Check Console for Errors
In Browser Console, look for:
```
✅ SUCCESS LOGS:
- "handleForgotPasswordEmail called"
- "Sending OTP request for email: user@example.com"
- "Response status: 200"
- "OTP sent successfully"

❌ ERROR LOGS (if you see these, note the error):
- "Error sending OTP:" - Network/CORS issue
- "Response status: 400" - Email not found
- "Response status: 429" - Rate limit (try again after 1 minute)
- "Response status: 500" - Backend error
- "Error from backend: [error message]"
```

---

## Problem 1: Modal Redirects to index.html

### Symptoms:
- Clicking "Send OTP" button closes modal and redirects to index.html
- Modal doesn't stay open for OTP input

### Root Cause:
Form submission behavior causing page navigation

### Solution Applied:
✅ Changed form buttons from `type="submit"` to `type="button"` with onclick handlers

### Verification Steps:
1. Open Browser DevTools (F12)
2. Click "Forgot password?" link
3. Verify modal opens and shows Step 1 (email input)
4. Enter email address
5. **Before clicking "Send OTP"**, check Console
6. Click "Send OTP" button
7. Immediately check if modal stays open

### If Still Failing:
1. Check Console tab for JavaScript errors
2. Look for any 404 errors (missing files)
3. Verify onclick handler exists: `onclick="handleForgotPasswordEmail(event);"`
4. Check if there are any global redirect functions being called

---

## Problem 2: No OTP Email Received

### Symptoms:
- Form submission appears to work (modal shows Step 2)
- But user receives no email with OTP code

### Possible Root Causes:
1. **SMTP Not Configured** - Most likely cause
2. **Email Template Missing** - OTP_RESET_PASSWORD template not in database
3. **Email Config Invalid** - Wrong SMTP credentials in SuperAdmin
4. **Backend Error** - Exception in email sending (check server logs)
5. **Email Service Down** - SMTP provider issue

### Debugging Checklist:

#### Step 1: Check Backend Logs
```bash
# Look for these log messages:
# SUCCESS:
"OTP generated and sent to email: user@example.com"

# ERRORS to look for:
"Failed to send OTP email to user@example.com:"
"Error sending OTP for email:"
"No valid EmailConfig found"
"SMTP authentication failed"
```

#### Step 2: Verify SMTP Configuration (SuperAdmin)
1. Log in to SuperAdmin dashboard
2. Go to Email Configuration section
3. Check if SMTP credentials are set:
   - ✅ SMTP Host: Should not be empty
   - ✅ SMTP Port: Should be 587 or 465
   - ✅ SMTP Username: Should be email address
   - ✅ SMTP Password: Should be set
   - ✅ From Email: Should match SMTP username
4. Click "Send Test Email" to verify SMTP works

#### Step 3: Check Email Template in Database
```sql
-- Run this query to verify OTP email template exists:
SELECT * FROM email_template WHERE email_type = 'OTP_RESET_PASSWORD';

-- Should return a row with:
- email_type: OTP_RESET_PASSWORD
- subject: Should contain "Password Reset OTP"
- body: Should be HTML template with placeholders like {{otp}}, {{userName}}, {{expiryMinutes}}
```

#### Step 4: Check Browser Network Tab
1. Open DevTools → Network tab
2. Click "Send OTP" button
3. Look for the POST request to `/api/auth/password-reset/forgot-password`
4. Click on it and check:
   - **Status**: Should be 200 (success)
   - **Response Tab**: Should show `{"success": true, "message": "OTP sent..."}`
   - **Headers Tab**: Should show `Content-Type: application/json`

#### Step 5: Check EmailDispatcher Logs
1. Look for logs mentioning "EmailDispatcher"
2. Check if email is being queued or dispatched
3. Look for any "Failed to dispatch" or "Failed to send" messages

---

## Full Error Messages Reference

### Response Status 400 (Bad Request)
```json
{
  "success": false,
  "message": "Email address not found in our system. Please check and try again.",
  "errorCode": "EMAIL_NOT_FOUND"
}
```
**Fix**: Enter a valid email that exists as a user in the system

### Response Status 429 (Too Many Requests)
```json
{
  "success": false,
  "message": "OTP request rate limited. Please try again after 1 minute(s)",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```
**Fix**: Wait 1 minute before requesting another OTP

### Response Status 500 (Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to send OTP. Please try again later.",
  "errorCode": "SEND_OTP_FAILED"
}
```
**Check**:
1. Backend server logs for exception details
2. SMTP configuration in SuperAdmin
3. Email template exists in database
4. Network connectivity to SMTP server

---

## Step-by-Step Debugging Flow

### If Modal Redirects:
```
1. Open DevTools Console
2. Click "Forgot password?" link
3. Check: "handleForgotPasswordEmail called" in logs?
   - NO → JavaScript not loaded, check page source
   - YES → Continue to step 4
4. Enter email and click "Send OTP"
5. Check: "Sending OTP request for email: ..." in logs?
   - NO → onclick handler not firing, check HTML button
   - YES → Continue to step 6
6. Check: "Response status: 200" in logs?
   - YES → OTP sent, check why modal redirects
   - 400 → Email not found
   - 429 → Rate limited
   - 500 → Backend error (check server logs)
```

### If OTP Not Received:
```
1. Verify form submission worked (modal shows Step 2)
2. Check Browser Console for error logs
3. Check Backend Logs for "OTP generated and sent" message
   - NOT FOUND → Check "SEND_OTP_FAILED" in response
   - FOUND → Email should be sending, check spam folder
4. Check SuperAdmin Email Configuration
   - Status showing "Not Configured"? → Configure SMTP
   - Status showing errors? → Fix credentials
5. Run Test Email from SuperAdmin
   - Receives test email? → SMTP works, template issue
   - No test email? → SMTP not configured correctly
6. Check Database for email_template
   ```sql
   SELECT * FROM email_template WHERE email_type = 'OTP_RESET_PASSWORD';
   ```
   - Empty result? → Template migration didn't run
   - Has result? → Template exists, check body
```

---

## Code Changes Made

### modals.html - Form Structure
```html
<!-- BEFORE: Form with listeners -->
<button type="submit" class="login-btn" id="fpSendOtpBtn">Send OTP</button>

<!-- AFTER: Direct onclick handler -->
<button type="button" class="login-btn" id="fpSendOtpBtn" 
        onclick="handleForgotPasswordEmail(event);">Send OTP</button>

<!-- BACKUP: Prevent form submission -->
<form class="modal-form" id="fpEmailForm" onsubmit="return false;">
```

### main.js - Event Handlers
```javascript
// REMOVED from DOMContentLoaded:
// const fpEmailForm = document.getElementById('fpEmailForm');
// if (fpEmailForm) fpEmailForm.addEventListener('submit', handleForgotPasswordEmail);

// ADDED onclick handler:
async function handleForgotPasswordEmail(e) {
    e.preventDefault();
    console.log('handleForgotPasswordEmail called');
    // ... rest of function
}

// Functions exported to window:
window.handleForgotPasswordEmail = handleForgotPasswordEmail;
```

---

## Testing Checklist

- [ ] Build compiles successfully: `./mvnw clean package`
- [ ] Backend starts without errors
- [ ] Frontend modal opens on "Forgot password?" click
- [ ] Modal stays open after clicking "Send OTP" (doesn't redirect)
- [ ] Step 2 form appears (OTP input, password fields)
- [ ] Console shows "handleForgotPasswordEmail called" log
- [ ] Console shows API response status
- [ ] OTP email received in inbox (or spam folder)
- [ ] OTP input matches received code
- [ ] Password reset completes successfully
- [ ] Redirected to login modal after success
- [ ] Can log in with new password

---

## Quick Reference - Key Files

- **Frontend Form**: [frontend/components/modals.html](frontend/components/modals.html#L219)
- **Frontend Logic**: [frontend/Javascript/main.js](frontend/Javascript/main.js#L300)
- **Backend Controller**: [src/main/java/com/Flatery/Controller/auth/PasswordResetController.java](src/main/java/com/Flatery/Controller/auth/PasswordResetController.java)
- **Backend Service**: [src/main/java/com/Flatery/service/PasswordResetService.java](src/main/java/com/Flatery/service/PasswordResetService.java)
- **Database Schema**: See V9__create_password_reset_otp_table.sql and V10__insert_otp_email_template.sql

---

## Useful SQL Queries for Debugging

```sql
-- Check if user exists
SELECT id, email, firstName FROM user WHERE email = 'test@example.com';

-- Check OTP records for an email
SELECT id, email, otp, expiresAt, isUsed, attempts, createdAt 
FROM password_reset_otp 
WHERE email = 'test@example.com' 
ORDER BY createdAt DESC;

-- Check SMTP configuration
SELECT * FROM email_config WHERE tenant_id IS NULL;

-- Check email template
SELECT id, email_type, subject, body FROM email_template 
WHERE email_type = 'OTP_RESET_PASSWORD';

-- Check email queue (to see if email was queued but not sent)
SELECT id, recipient_email, email_type, status, created_at 
FROM email_queue 
WHERE email_type = 'OTP_RESET_PASSWORD' 
ORDER BY created_at DESC;
```

---

## Contact & Next Steps

If issues persist after following these steps:

1. **Collect Information**:
   - Browser Console logs (Ctrl+Shift+J, copy all logs)
   - Backend server logs
   - Database query results from above
   - Screenshot of error message

2. **Verify Configuration**:
   - SMTP credentials in SuperAdmin panel
   - Email template exists in database
   - User exists in database

3. **Test in Isolation**:
   - Use Postman to test API directly
   - Check if email service works independently
   - Try with different email addresses
