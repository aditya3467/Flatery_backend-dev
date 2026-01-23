# Email Notifications Quick Reference

## What Was Added

### 1. Email Types (`EmailType.java`)
```java
PAYMENT_SUBMISSION          // Tenant submits payment → Owner notified
PAYMENT_APPROVED            // Owner approves payment → Tenant notified
PAYMENT_REJECTED            // Owner rejects payment → Tenant notified
PAYMENT_REMINDER            // Pending payment reminder → Owner notified
MAINTENANCE_REQUEST_SUBMITTED     // Tenant raises issue → Owner notified
MAINTENANCE_REQUEST_ACKNOWLEDGED  // Owner acknowledges → Tenant notified
MAINTENANCE_REQUEST_RESOLVED      // Issue resolved → Tenant notified
```

### 2. Email Templates
All templates have been added with:
- Professional HTML design
- Plain text fallback
- Proper brand colors and styling
- Action buttons with links
- All required placeholders

### 3. Code Integration Points

#### TransactionService Updates
**File**: `src/main/java/com/Flatery/service/payment/TransactionService.java`

- Line 26: Added `EmailType` import
- Line 27: Added `EmailEvents` import  
- Line 31: Added `HashMap` and `Map` imports
- Line 43: Injected `EmailEvents` service
- Line 52: Added `emailEvents` parameter to constructor

**Payment Submission (createManualPayment)**
```java
// Automatically sends PAYMENT_SUBMISSION email to owner
// With payment details and dashboard link
```

**Payment Approval (verifyTransaction)**
```java
// Automatically sends PAYMENT_APPROVED email to tenant
// With transaction details and payment history link
```

**Payment Rejection (rejectTransaction)**
```java
// Automatically sends PAYMENT_REJECTED email to tenant
// With rejection reason and resubmit link
```

#### NotificationService Updates
**File**: `src/main/java/com/Flatery/service/NotificationService.java`

**New Imports**:
- `EmailType`
- `EmailEvents`
- `User`
- `DateTimeFormatter`
- `HashMap`, `Map`

**New Methods**:
1. `sendMaintenanceRequestEmail()` - Line 238
2. `sendMaintenanceAcknowledgedEmail()` - Line 267
3. `sendMaintenanceResolvedEmail()` - Line 296
4. `sendRentReminderEmail()` - Line 324
5. `sendRentOverdueEmail()` - Line 351
6. `sendPaymentConfirmationEmail()` - Line 377

### 4. Email Template Seeder Updates
**File**: `src/main/java/com/Flatery/email/seeder/EmailTemplateSeeder.java`

Added 7 new templates with complete HTML/text bodies and placeholder definitions.

---

## Quick Integration Guide

### For Payment Events

**Step 1**: Already integrated in TransactionService
- No code changes needed
- Emails sent automatically

### For Maintenance Events

**Integration in ComplaintService or MaintenanceController**:

```java
// When complaint is submitted
notificationService.sendMaintenanceRequestEmail(
    ownerId,
    complaintDTO.getTenantName(),
    complaintDTO.getUnitNumber(),
    complaintDTO.getTitle(),
    complaintDTO.getDescription(),
    complaintDTO.getPriority()
);

// When owner acknowledges
notificationService.sendMaintenanceAcknowledgedEmail(
    tenantId,
    complaint.getTitle(),
    complaint.getUnitNumber(),
    "IN_PROGRESS",
    "2-3 days",
    ownerResponse.getMessage()
);

// When complaint is resolved
notificationService.sendMaintenanceResolvedEmail(
    tenantId,
    complaint.getTitle(),
    complaint.getUnitNumber(),
    resolutionNotes
);
```

### For Rent Reminders

**Integration in RentReminderScheduler**:

```java
// Send monthly rent reminders
notificationService.sendRentReminderEmail(
    tenantId,
    propertyName,
    unitNumber,
    monthlyRent,
    dueDateString
);

// Send overdue warnings
notificationService.sendRentOverdueEmail(
    tenantId,
    propertyName,
    unitNumber,
    overdueAmount,
    originalDueDateString
);
```

---

## Email Sending Flow

```
Event (Payment/Maintenance/Reminder)
  ↓
Service Method Called (Transaction/Notification Service)
  ↓
EmailEvents.publish() triggered
  ↓
EmailDispatchEvent published
  ↓
EmailEventListener catches event
  ↓
EmailDispatcher validates template exists
  ↓
Placeholder data merged into template
  ↓
Email queued in database
  ↓
EmailSenderWorker (scheduled job)
  ↓
SmtpSenderService sends via SMTP
  ↓
Success/Failure logged in email_logs table
```

---

## Testing the Implementation

### 1. Verify Templates Loaded
```sql
SELECT * FROM email_templates WHERE template_key IN (
    'PAYMENT_SUBMISSION', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED',
    'MAINTENANCE_REQUEST_SUBMITTED', 'MAINTENANCE_REQUEST_ACKNOWLEDGED',
    'MAINTENANCE_REQUEST_RESOLVED'
);
```

### 2. Test Payment Flow
1. Go to property-config.html
2. Click on unit → View tenants
3. Open add payment modal
4. Submit payment as tenant
5. Check Admin Email Logs for PAYMENT_SUBMISSION email
6. Approve payment in owner dashboard
7. Check tenant inbox for PAYMENT_APPROVED email

### 3. Test Manual Email Sending
```java
@Autowired
private NotificationService notificationService;

// In any controller
notificationService.sendRentReminderEmail(
    1L, // tenantId
    "Sunny Apartments",
    "Unit 101",
    10000.00,
    "Jan 31, 2026"
);
```

---

## Configuration Checklist

- [ ] SMTP configured in Superadmin Email settings
- [ ] Email credentials verified with "Verify Credentials" button
- [ ] Test email sent successfully
- [ ] Email templates show as Active in Admin panel
- [ ] EmailSenderWorker scheduled task is running
- [ ] All email types appear in Templates list

---

## Troubleshooting

### Emails not appearing in email_logs?
- Check if SMTP is configured and enabled
- Verify email service is not paused
- Check backend logs for errors

### Template not found error?
- Verify template is in database with correct EmailType enum value
- Check if template is set to active
- Restart application to reseed templates

### Emails in queue but not sending?
- Check if EmailSenderWorker is running
- Verify SMTP credentials are correct
- Check for SMTP connection errors in logs

### Wrong email variables/placeholders?
- Verify all required placeholders are in emailData map
- Check template placeholder names match exactly
- Review template definition in seeder

---

## Files Modified

1. ✅ `src/main/java/com/Flatery/email/EmailType.java`
   - Added 7 new email types

2. ✅ `src/main/java/com/Flatery/email/seeder/EmailTemplateSeeder.java`
   - Added 7 new email templates with HTML/text bodies

3. ✅ `src/main/java/com/Flatery/service/payment/TransactionService.java`
   - Injected EmailEvents service
   - Added email sending to payment submission/approval/rejection

4. ✅ `src/main/java/com/Flatery/service/NotificationService.java`
   - Injected EmailEvents service
   - Added 6 email sending methods

---

## Next Steps

1. **Restart Application** - Templates will be seeded
2. **Configure SMTP** - Superadmin panel
3. **Test Payment Flow** - Follow testing steps above
4. **Monitor Email Logs** - Verify successful sending
5. **Integrate Maintenance** - Add calls to sendMaintenanceRequestEmail() etc.
6. **Setup Rent Reminders** - Schedule sendRentReminderEmail() calls

---

## Email Types Map

| Event | Type | Recipient | Template |
|-------|------|-----------|----------|
| Payment Submitted | PAYMENT_SUBMISSION | Owner | New Payment Submission - ₹{{amount}} |
| Payment Approved | PAYMENT_APPROVED | Tenant | Your Payment has been Approved ✅ |
| Payment Rejected | PAYMENT_REJECTED | Tenant | Your Payment Submission was Rejected ❌ |
| Pending Review | PAYMENT_REMINDER | Owner | Payment Pending - ₹{{amount}} |
| Maintenance Submitted | MAINTENANCE_REQUEST_SUBMITTED | Owner | New Maintenance Request from {{tenant_name}} |
| Maintenance Acked | MAINTENANCE_REQUEST_ACKNOWLEDGED | Tenant | Your Maintenance Request has been Acknowledged |
| Maintenance Resolved | MAINTENANCE_REQUEST_RESOLVED | Tenant | Your Maintenance Request has been Resolved ✅ |

---

## Done! ✅

All email notifications have been implemented with:
- ✅ Professional templates
- ✅ Proper placeholders
- ✅ Service integration
- ✅ Error handling
- ✅ Database logging
- ✅ Documentation

System is ready for testing and deployment!
