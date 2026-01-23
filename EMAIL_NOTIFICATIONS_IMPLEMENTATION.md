# Email Notifications Implementation Guide

## Overview
Comprehensive email notification system has been implemented for all major events in the Flatery application including payment submissions, payment verification, maintenance requests, and rent reminders.

---

## New Email Types Added

### 1. **PAYMENT_SUBMISSION**
- **Recipient**: Owner
- **Trigger**: When tenant submits a payment
- **Template Variables**:
  - `owner_name`: Owner's first name
  - `tenant_name`: Tenant's name
  - `amount`: Payment amount
  - `payment_month`: Month of payment
  - `payment_mode`: Payment method (UPI, Bank Transfer, Cash)
  - `submission_date`: Date and time of submission
  - `dashboard_url`: Link to review payment

### 2. **PAYMENT_APPROVED**
- **Recipient**: Tenant
- **Trigger**: When owner approves/verifies a payment
- **Template Variables**:
  - `tenant_name`: Tenant's name
  - `amount`: Approved amount
  - `property_name`: Property name
  - `payment_month`: Month for which payment was made
  - `approval_date`: Date of approval
  - `transaction_id`: Transaction identifier
  - `payment_history_url`: Link to payment history

### 3. **PAYMENT_REJECTED**
- **Recipient**: Tenant
- **Trigger**: When owner rejects a payment submission
- **Template Variables**:
  - `tenant_name`: Tenant's name
  - `amount`: Rejected amount
  - `property_name`: Property name
  - `payment_month`: Month for which payment was rejected
  - `rejection_reason`: Reason for rejection
  - `rejection_date`: Date of rejection
  - `submit_payment_url`: Link to resubmit payment

### 4. **PAYMENT_REMINDER**
- **Recipient**: Owner
- **Trigger**: Reminder for pending payment reviews (manual or scheduled)
- **Template Variables**:
  - `owner_name`: Owner's first name
  - `tenant_name`: Tenant's name
  - `amount`: Payment amount
  - `payment_month`: Month of payment
  - `days_pending`: Number of days awaiting review
  - `dashboard_url`: Link to dashboard

### 5. **MAINTENANCE_REQUEST_SUBMITTED**
- **Recipient**: Owner
- **Trigger**: When tenant submits a maintenance/complaint request
- **Template Variables**:
  - `owner_name`: Owner's first name
  - `tenant_name`: Tenant's name
  - `unit_number`: Unit/Room number
  - `issue_title`: Title of the issue
  - `issue_description`: Detailed description
  - `priority`: Priority level (High/Medium/Low)
  - `submission_date`: Date of submission
  - `dashboard_url`: Link to maintenance dashboard

### 6. **MAINTENANCE_REQUEST_ACKNOWLEDGED**
- **Recipient**: Tenant
- **Trigger**: When owner acknowledges the maintenance request
- **Template Variables**:
  - `tenant_name`: Tenant's name
  - `unit_number`: Unit/Room number
  - `issue_title`: Title of the issue
  - `status`: Current status
  - `resolution_time`: Expected time to resolve
  - `owner_message`: Message from owner
  - `tracking_url`: Link to track request

### 7. **MAINTENANCE_REQUEST_RESOLVED**
- **Recipient**: Tenant
- **Trigger**: When maintenance work is completed
- **Template Variables**:
  - `tenant_name`: Tenant's name
  - `unit_number`: Unit/Room number
  - `issue_title`: Title of the issue
  - `completion_date`: Date of completion
  - `completion_notes`: Work completion details
  - `feedback_url`: Link to provide feedback

---

## Implementation Details

### 1. Updated EmailType Enum
**File**: `src/main/java/com/Flatery/email/EmailType.java`

Added new payment and maintenance related email types.

### 2. Email Template Seeder
**File**: `src/main/java/com/Flatery/email/seeder/EmailTemplateSeeder.java`

Added 7 new email templates with:
- HTML body with professional styling
- Plain text fallback
- Proper template variables
- Beautiful responsive design with action buttons

### 3. TransactionService Integration
**File**: `src/main/java/com/Flatery/service/payment/TransactionService.java`

**Changes**:
- Injected `EmailEvents` service
- Added email sending logic to payment submission flow
- Added email sending to payment approval flow
- Added email sending to payment rejection flow
- Email data includes all necessary context

**Methods Enhanced**:
- `createManualPayment()` → Sends PAYMENT_SUBMISSION email
- `verifyTransaction()` → Sends PAYMENT_APPROVED email
- `rejectTransaction()` → Sends PAYMENT_REJECTED email

### 4. NotificationService Email Methods
**File**: `src/main/java/com/Flatery/service/NotificationService.java`

**New Email Methods**:
- `sendMaintenanceRequestEmail()` - Send to owner when tenant raises issue
- `sendMaintenanceAcknowledgedEmail()` - Send to tenant when owner acknowledges
- `sendMaintenanceResolvedEmail()` - Send to tenant when issue is resolved
- `sendRentReminderEmail()` - Send rent due reminder to tenant
- `sendRentOverdueEmail()` - Send rent overdue warning to tenant
- `sendPaymentConfirmationEmail()` - Send payment confirmation to tenant

---

## How to Use

### For Payment Notifications

**When tenant submits payment:**
```java
// Already handled in TransactionService.createManualPayment()
// Email automatically sent to owner with PAYMENT_SUBMISSION type
```

**When owner approves payment:**
```java
// Already handled in TransactionService.verifyTransaction()
// Email automatically sent to tenant with PAYMENT_APPROVED type
```

**When owner rejects payment:**
```java
// Already handled in TransactionService.rejectTransaction()
// Email automatically sent to tenant with PAYMENT_REJECTED type
```

### For Maintenance Notifications

**When tenant raises maintenance request:**
```java
notificationService.sendMaintenanceRequestEmail(
    ownerId, 
    "John Doe", 
    "Unit 101", 
    "Water Leak", 
    "Bathroom ceiling has water leak", 
    "HIGH"
);
```

**When owner acknowledges request:**
```java
notificationService.sendMaintenanceAcknowledgedEmail(
    tenantId, 
    "Water Leak", 
    "Unit 101", 
    "IN_PROGRESS", 
    "2-3 days", 
    "Will send plumber tomorrow morning"
);
```

**When maintenance is completed:**
```java
notificationService.sendMaintenanceResolvedEmail(
    tenantId, 
    "Water Leak", 
    "Unit 101", 
    "Ceiling has been repaired and tested"
);
```

### For Rent Reminders

**Send rent due reminder:**
```java
notificationService.sendRentReminderEmail(
    tenantId, 
    "Sunny Apartments", 
    "Unit 101", 
    10000.00, 
    "Jan 31, 2026"
);
```

**Send overdue warning:**
```java
notificationService.sendRentOverdueEmail(
    tenantId, 
    "Sunny Apartments", 
    "Unit 101", 
    10000.00, 
    "Jan 31, 2026"
);
```

---

## Email Flow Architecture

```
Event Trigger (e.g., Payment Submitted)
    ↓
TransactionService / NotificationService
    ↓
EmailEvents.publish(EmailType, recipient, emailData)
    ↓
EmailDispatchEvent (Spring Event)
    ↓
EmailEventListener
    ↓
EmailDispatcher (validates template, merges data)
    ↓
EmailQueue (stores for sending)
    ↓
EmailSenderWorker (scheduled task)
    ↓
SmtpSenderService (actual email sending)
    ↓
EmailLog (records delivery status)
```

---

## Database Tables

The following tables are used (already created by existing schema):

1. **email_templates** - Email template definitions
2. **email_queue** - Pending emails
3. **email_logs** - Email delivery history
4. **email_config** - SMTP configuration

---

## Configuration Required

### SMTP Configuration

Admin users must configure SMTP settings via the Superadmin Email panel:

1. Go to Superadmin Dashboard
2. Navigate to Email section
3. Configure SMTP settings:
   - Provider: SMTP
   - Host: smtp.gmail.com (or your SMTP server)
   - Port: 587 (TLS) or 465 (SSL)
   - Username: your email
   - Password: app-specific password
   - From Email: your email
   - From Name: "Flatery"

4. Test connection using "Verify Credentials" button
5. Send test email to confirm setup

---

## Email Customization

To customize email templates:

1. **Via Superadmin Panel**:
   - Go to Superadmin Dashboard → Email section
   - Select template type
   - Edit HTML and text body
   - Modify placeholders as needed
   - Save changes

2. **Programmatically**:
   - Use `/api/superadmin/email/templates` POST endpoint
   - Provide template data with all required placeholders
   - System validates placeholder completeness

---

## Error Handling

- **If email service fails**: Notifications still work, email delivery is logged
- **If template not found**: Email sending is skipped with warning
- **If SMTP not configured**: Emails queued but not sent until configured
- **Retries**: Failed emails automatically retried with exponential backoff
- **Monitoring**: Check email logs for delivery status

---

## Testing

### To test email sending:

1. **Configure SMTP** in Superadmin panel
2. **Send test email** using "Send Test Email" button
3. **Monitor Email Logs** to see delivery status
4. **Check email inbox** for test email

### Manual test flow:

1. Tenant submits payment → Owner receives email
2. Owner approves payment → Tenant receives email
3. Owner rejects payment → Tenant receives email
4. Tenant raises complaint → Owner receives email
5. Owner acknowledges → Tenant receives email

---

## Troubleshooting

### Emails not sending?

1. **Check SMTP Configuration**:
   - Verify credentials are correct
   - Test connection from Superadmin panel
   - Check if email service is enabled (not paused)

2. **Check Email Logs**:
   - Go to Superadmin Email section
   - Look at recent logs
   - Check error messages

3. **Verify Templates**:
   - Ensure templates are active
   - Check placeholder placeholders match data being sent
   - Verify HTML/text bodies are not empty

4. **Check Email Queue**:
   - Verify emails are being queued
   - Check if EmailSenderWorker is running
   - Look for any processing errors

5. **Check Logs**:
   - Backend logs: `transactionService`, `emailEvents`, `emailDispatcher`
   - Database: `email_logs` table

---

## Performance Considerations

- Emails are sent asynchronously via queue
- Scheduled worker processes queue every few minutes
- Large batches are processed efficiently
- Database transactions are properly isolated
- No impact on payment/notification creation performance

---

## Security

- SMTP password encrypted in database using AES-GCM
- Email templates sanitized before sending
- User data properly escaped in email content
- Authentication required for template management
- Only authorized users can modify settings

---

## Future Enhancements

1. **Scheduled Reminders**: Automated rent reminders on specific dates
2. **SMS Notifications**: Add SMS alongside email
3. **WhatsApp Integration**: Send notifications via WhatsApp
4. **Email Templates UI**: Visual editor for email design
5. **A/B Testing**: Test different email versions
6. **Analytics**: Track email open rates and clicks
7. **Unsubscribe**: Allow users to control notification preferences

---

## Summary

The email notification system is now fully integrated with:
- ✅ Payment submission/approval/rejection emails
- ✅ Maintenance request notifications
- ✅ Rent reminders and overdue warnings
- ✅ Professional HTML templates
- ✅ Proper error handling
- ✅ Database logging and tracking
- ✅ SMTP configuration management
- ✅ Superadmin template editing

All notifications are sent immediately after events occur and properly logged for audit trail.
