# Quick Test Checklist - Forgot Password Feature

## Pre-Test Setup
- [ ] Backend compiled successfully (`./mvnw clean package -DskipTests`)
- [ ] Backend running (`./mvnw spring-boot:run`)
- [ ] Frontend accessible at http://localhost:8080
- [ ] Browser DevTools open (F12)
- [ ] Console tab active (Ctrl+Shift+J)

## Test Execution Flow

### Test 1: Modal Redirect Fix (CRITICAL)
**Objective**: Verify modal stays open after clicking "Send OTP"

```
Steps:
1. Navigate to login page
2. Click "Log in" button
3. Click "Forgot password?" link
   ✅ Verify: Modal opens with email input field
   
4. Enter any test email (e.g., test@example.com)
5. Click "Send OTP" button
   ⏸ Wait 2 seconds for response
   ✅ CRITICAL: Modal should STILL be visible (doesn't redirect to index.html)
   ❌ If redirected: Check browser URL (should still be same page)
   
6. Check Browser Console
   ✅ Should see logs:
      - "handleForgotPasswordEmail called"
      - "Sending OTP request for email: test@example.com"
      - "Response status: 200" OR error status (400, 429, 500)
```

**Expected Console Output** (Success):
```
handleForgotPasswordEmail called
main.js:329
Sending OTP request for email: test@example.com
main.js:354
Response status: 200
main.js:357
Response data: {success: true, message: "OTP sent to your registered email...", otpValiditySeconds: 600}
main.js:358
OTP sent successfully
main.js:361
```

**Expected Console Output** (Error - Email Not Found):
```
handleForgotPasswordEmail called
...
Response status: 400
Response data: {success: false, message: "Email address not found in our system...", errorCode: "EMAIL_NOT_FOUND"}
...
Error from backend: Email address not found in our system...
```

---

### Test 2: Modal Transition
**Objective**: Verify modal transitions from Step 1 to Step 2

**Precondition**: Test 1 completed successfully (OTP sent response received)

```
Expected State After "Send OTP":
- Email input field: HIDDEN
- OTP input field: VISIBLE (with placeholder "000000")
- Password fields: VISIBLE
- "Send OTP" button: GONE
- "Reset Password" button: VISIBLE
- OTP validity countdown: Shows "OTP valid for 10:00"
```

**If Not Transitioned**:
1. Check Console for errors
2. Look for "Error from backend:" logs
3. See error codes:
   - 400: Email not found
   - 429: Rate limited (try again in 1 minute)
   - 500: Backend error (check server logs)

---

### Test 3: Email Reception
**Objective**: Verify OTP email was received

```
Timing: Should receive email within 5 seconds of clicking "Send OTP"

Check Email:
1. Open email inbox (Gmail, Yahoo, Outlook, etc.)
2. Look for email with subject containing "Password Reset OTP"
3. If not found in inbox: Check SPAM/JUNK folder
4. If found:
   ✅ Copy 6-digit OTP code from email
   
5. Return to browser with Step 2 form
6. Paste/enter OTP code in "Enter OTP (6 digits)" field
7. Enter new password (min 6 characters)
8. Confirm password (must match)
9. Click "Reset Password"
```

**If Email Not Received**:
1. Check Browser Console for errors
   - If error shown: See error reference table below
   - If NO error: SMTP may not be configured
2. Go to SuperAdmin panel
3. Navigate to Email Configuration
4. Verify SMTP settings are configured
5. Click "Send Test Email"
6. Check if test email received
7. If test email works: Database/template issue
8. If test email fails: SMTP credentials invalid

---

### Test 4: Password Reset Success
**Objective**: Verify password reset completes successfully

```
Prerequisites:
- OTP received in email
- Step 2 form visible in modal

Steps:
1. Enter OTP from email (6 digits)
2. Enter new password (at least 6 characters)
3. Re-enter password for confirmation
4. Click "Reset Password" button

Expected Behavior:
- Button text changes to "Resetting Password..."
- After 2-3 seconds: Success message appears
  "✅ Password Reset Successful!"
  "Your password has been successfully updated. You can now log in with your new password."
- "Go to Login" button appears
- Modal auto-closes after 3 seconds
- Login modal appears
- Can log in with new password

Check Console:
✅ Should see logs:
   - "handleForgotPasswordOtp called"
   - "Sending password reset request"
   - "Reset response status: 200"
   - "Password reset successful"
```

**If Password Reset Fails**:
1. Check Console logs for error message
2. Common errors:
   - "OTP has expired" - Request new OTP
   - "Invalid OTP" - Check OTP number, try again
   - "Maximum OTP attempts exceeded" - Request new OTP
   - "Passwords do not match" - Ensure passwords match

---

## Error Reference Table

| Status | Error Message | Action |
|--------|---------------|--------|
| 200 | ✅ OTP sent to your registered email | Continue to Step 2 |
| 400 | Email address not found | Check email exists in system |
| 429 | OTP request rate limited. Please try again after 1 minute(s) | Wait 1 minute, try again |
| 500 | Failed to send OTP. Please try again later. | Check server logs, SMTP config |
| Network Error | Network error. Please check your connection. | Check internet connection, server running |

---

## Console Debugging Commands

### Check if Functions Exist
```javascript
// In Console tab, type these to verify functions are loaded:
typeof handleForgotPasswordEmail
// Should return: "function"

typeof handleForgotPasswordOtp
// Should return: "function"

typeof closeForgotPasswordModal
// Should return: "function"
```

### Manually Call Form Handler (Advanced)
```javascript
// If button click isn't working, try:
handleForgotPasswordEmail({preventDefault: () => {}})
// Check console for "handleForgotPasswordEmail called"
```

---

## Network Tab Debugging

### Checking API Requests
1. Open DevTools → Network tab
2. Clear previous requests (circle with slash icon)
3. Click "Send OTP" button
4. Look for request to: `/api/auth/password-reset/forgot-password`
5. Click on request to see details:

**Request Tab**:
- Method: POST
- URL: http://localhost:8080/api/auth/password-reset/forgot-password
- Body: `{"email":"test@example.com"}`

**Response Tab**:
- Status: 200 (success), 400 (error), 429 (rate limit), 500 (server error)
- Body: JSON response with success, message, and errorCode

**Headers Tab**:
- Content-Type: application/json

---

## Test Scenarios

### Scenario 1: First-Time User (Happy Path)
```
1. Open login modal → Click "Forgot password?"
2. Enter registered email
3. Click "Send OTP"
4. Receive email with OTP
5. Enter OTP and new password
6. Click "Reset Password"
7. See success message
8. Close modal
9. Log in with new password
Result: ✅ PASS
```

### Scenario 2: Invalid Email
```
1. Open forgot password modal
2. Enter non-existent email (e.g., invalid@example.com)
3. Click "Send OTP"
4. Expected: Error message "Email address not found in our system"
Result: ✅ PASS if error shown
```

### Scenario 3: Rate Limiting
```
1. Request OTP for email
2. Wait 5 seconds (OTP sent)
3. Click "Start Over" or open modal again
4. Enter same email
5. Click "Send OTP" immediately
6. Expected: Error "OTP request rate limited. Please try again after 1 minute(s)"
Result: ✅ PASS if rate limit enforced
```

### Scenario 4: Wrong OTP
```
1. Complete Steps 1-4 from Scenario 1
2. In Step 2, enter WRONG OTP (e.g., 000000)
3. Click "Reset Password"
4. Expected: Error "Invalid OTP. Please try again."
5. Enter correct OTP
6. Click "Reset Password"
7. Should proceed with password reset
Result: ✅ PASS if wrong OTP rejected, correct OTP accepted
```

### Scenario 5: Expired OTP
```
1. Request OTP
2. Wait 10+ minutes (OTP validity: 10 minutes)
3. Try to enter expired OTP
4. Click "Reset Password"
5. Expected: Error "OTP has expired. Please request a new OTP."
Result: ✅ PASS if expiry enforced
```

---

## Success Criteria

- [ ] Modal doesn't redirect when clicking "Send OTP"
- [ ] Console shows "handleForgotPasswordEmail called"
- [ ] Console shows "Response status: 200" for valid email
- [ ] Modal transitions to Step 2 after successful OTP send
- [ ] OTP email received in inbox within 5 seconds
- [ ] Can enter OTP, password, and reset successfully
- [ ] Success message displayed after password reset
- [ ] Can log in with new password
- [ ] Rate limiting works (1 request per minute)
- [ ] Invalid emails show error

---

## Troubleshooting Quick Links

| Issue | Location |
|-------|----------|
| Modal redirects to index.html | [DEBUGGING: Problem 1](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#problem-1-modal-redirects-to-indexhtml) |
| No OTP email received | [DEBUGGING: Problem 2](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#problem-2-no-otp-email-received) |
| SMTP configuration | [DEBUGGING: Step 2](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#step-2-verify-smtp-configuration-superadmin) |
| Email template check | [DEBUGGING: Step 3](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#step-3-check-email-template-in-database) |
| Error message reference | [DEBUGGING: Error Messages](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#full-error-messages-reference) |
| SQL debugging queries | [DEBUGGING: SQL Queries](FORGOT_PASSWORD_DEBUGGING_GUIDE.md#useful-sql-queries-for-debugging) |

---

## Notes
- Use Chrome/Firefox DevTools for best debugging experience
- Check Console tab first for error messages
- Check Network tab to verify API calls
- Keep browser DevTools open during testing
- Take screenshots of any errors for troubleshooting
