# Maintenance Request Email Integration Guide

## Overview
This guide shows how to integrate email notifications into the existing complaint/maintenance request system.

---

## Integration Points

### 1. When Tenant Submits Complaint

**Location**: ComplaintController or ComplaintsService

```java
// After complaint is saved
Long complaintId = savedComplaint.getId();
Long tenantId = complaint.getTenantId();
Long ownerId = property.getOwnerId(); // Get from property

// Notify owner via email
notificationService.sendMaintenanceRequestEmail(
    ownerId,
    tenant.getName(),                    // Tenant name
    tenant.getUnitNumber(),              // Unit/Room number
    complaint.getTitle(),                // Issue title
    complaint.getDescription(),          // Detailed description
    complaint.getPriority()              // HIGH/MEDIUM/LOW
);

// Also create in-app notification
notificationService.notifyMaintenanceRequest(
    ownerId,
    tenantId,
    tenant.getName(),
    complaint.getTitle()
);
```

### 2. When Owner Acknowledges Request

**Location**: ComplaintController or ComplaintsService (when status changes to IN_PROGRESS)

```java
// After complaint status is updated
complaint.setStatus("IN_PROGRESS");
complaint.setOwnerAcknowledgement(ownerMessage);
savedComplaint = complaintRepository.save(complaint);

// Send acknowledgment email to tenant
notificationService.sendMaintenanceAcknowledgedEmail(
    tenantId,
    complaint.getTitle(),                // Issue title
    tenant.getUnitNumber(),              // Unit number
    "IN_PROGRESS",                       // Current status
    "2-3 days",                          // Expected resolution time
    ownerMessage                         // Owner's message
);
```

### 3. When Issue is Resolved

**Location**: ComplaintController or ComplaintsService (when status changes to RESOLVED)

```java
// After complaint is resolved
complaint.setStatus("RESOLVED");
complaint.setCompletionNotes(resolutionDetails);
complaint.setResolvedDate(LocalDateTime.now());
savedComplaint = complaintRepository.save(complaint);

// Send resolution email to tenant
notificationService.sendMaintenanceResolvedEmail(
    tenantId,
    complaint.getTitle(),                // Issue title
    tenant.getUnitNumber(),              // Unit number
    resolutionDetails                    // Work completion notes
);
```

---

## Sample Code Implementation

### ComplaintService Update

```java
package com.Flatery.service;

import com.Flatery.model.Complaint;
import com.Flatery.model.Tenant;
import com.Flatery.repository.ComplaintRepository;
import com.Flatery.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private NotificationService notificationService;

    /**
     * Create new complaint and notify owner via email
     */
    @Transactional
    public Complaint createComplaint(Complaint complaint, Long tenantId) {
        // Save complaint
        complaint.setTenantId(tenantId);
        complaint.setStatus("OPEN");
        complaint.setCreatedDate(LocalDateTime.now());
        Complaint savedComplaint = complaintRepository.save(complaint);

        // Get tenant and property info
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new RuntimeException("Tenant not found"));

        // Send email to owner
        try {
            notificationService.sendMaintenanceRequestEmail(
                tenant.getOwnerId(),
                tenant.getTenantName(),
                tenant.getFlatRoomNumber(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getPriority() // HIGH, MEDIUM, LOW
            );
            System.out.println("Maintenance request email sent to owner");
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            // Don't fail complaint creation if email fails
        }

        // Also create in-app notification
        try {
            notificationService.notifyMaintenanceRequest(
                tenant.getOwnerId(),
                tenantId,
                tenant.getTenantName(),
                complaint.getTitle()
            );
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return savedComplaint;
    }

    /**
     * Owner acknowledges complaint and sends update to tenant
     */
    @Transactional
    public Complaint acknowledgeComplaint(Long complaintId, String ownerMessage) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Update complaint
        complaint.setStatus("IN_PROGRESS");
        complaint.setOwnerAcknowledgement(ownerMessage);
        complaint.setAcknowledgedDate(LocalDateTime.now());
        Complaint updated = complaintRepository.save(complaint);

        // Get tenant info
        Tenant tenant = tenantRepository.findById(complaint.getTenantId())
            .orElseThrow(() -> new RuntimeException("Tenant not found"));

        // Send email to tenant
        try {
            notificationService.sendMaintenanceAcknowledgedEmail(
                tenant.getId(),
                complaint.getTitle(),
                tenant.getFlatRoomNumber(),
                "IN_PROGRESS",
                "2-3 days",  // Can be customized based on issue
                ownerMessage
            );
            System.out.println("Maintenance acknowledgment email sent to tenant");
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return updated;
    }

    /**
     * Mark complaint as resolved and notify tenant
     */
    @Transactional
    public Complaint resolveComplaint(Long complaintId, String completionNotes) {
        Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Update complaint
        complaint.setStatus("RESOLVED");
        complaint.setCompletionNotes(completionNotes);
        complaint.setResolvedDate(LocalDateTime.now());
        Complaint updated = complaintRepository.save(complaint);

        // Get tenant info
        Tenant tenant = tenantRepository.findById(complaint.getTenantId())
            .orElseThrow(() -> new RuntimeException("Tenant not found"));

        // Send email to tenant
        try {
            notificationService.sendMaintenanceResolvedEmail(
                tenant.getId(),
                complaint.getTitle(),
                tenant.getFlatRoomNumber(),
                completionNotes
            );
            System.out.println("Maintenance resolution email sent to tenant");
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return updated;
    }
}
```

---

## Controller Integration

### ComplaintController Update

```java
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    /**
     * Create complaint - automatically sends email to owner
     */
    @PostMapping
    public ResponseEntity<?> createComplaint(
        @RequestBody ComplaintDTO dto,
        @RequestParam Long tenantId
    ) {
        try {
            Complaint complaint = new Complaint();
            complaint.setTitle(dto.getTitle());
            complaint.setDescription(dto.getDescription());
            complaint.setPriority(dto.getPriority());
            complaint.setCategory(dto.getCategory());
            complaint.setAttachmentUrl(dto.getAttachmentUrl());

            // Create complaint and send email
            Complaint created = complaintService.createComplaint(complaint, tenantId);

            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to create complaint: " + e.getMessage());
        }
    }

    /**
     * Acknowledge complaint - sends email to tenant
     */
    @PutMapping("/{complaintId}/acknowledge")
    public ResponseEntity<?> acknowledgeComplaint(
        @PathVariable Long complaintId,
        @RequestBody AcknowledgmentDTO dto
    ) {
        try {
            Complaint updated = complaintService.acknowledgeComplaint(
                complaintId,
                dto.getOwnerMessage()
            );
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to acknowledge complaint: " + e.getMessage());
        }
    }

    /**
     * Resolve complaint - sends email to tenant
     */
    @PutMapping("/{complaintId}/resolve")
    public ResponseEntity<?> resolveComplaint(
        @PathVariable Long complaintId,
        @RequestBody ResolutionDTO dto
    ) {
        try {
            Complaint updated = complaintService.resolveComplaint(
                complaintId,
                dto.getCompletionNotes()
            );
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to resolve complaint: " + e.getMessage());
        }
    }
}
```

---

## DTOs

```java
@Data
public class ComplaintDTO {
    private String title;
    private String description;
    private String priority;      // HIGH, MEDIUM, LOW
    private String category;      // Plumbing, Electrical, etc.
    private String attachmentUrl;
}

@Data
public class AcknowledgmentDTO {
    private String ownerMessage;
}

@Data
public class ResolutionDTO {
    private String completionNotes;
}
```

---

## Email Template Variables Reference

### MAINTENANCE_REQUEST_SUBMITTED
- `owner_name`: Owner's first name
- `tenant_name`: Tenant's full name
- `unit_number`: Unit/Room number
- `issue_title`: Title of the issue
- `issue_description`: Detailed description
- `priority`: HIGH/MEDIUM/LOW
- `submission_date`: Date and time
- `dashboard_url`: Link to maintenance dashboard

### MAINTENANCE_REQUEST_ACKNOWLEDGED
- `tenant_name`: Tenant's first name
- `unit_number`: Unit/Room number
- `issue_title`: Title of the issue
- `status`: Current status (IN_PROGRESS)
- `resolution_time`: Expected resolution time
- `owner_message`: Message from owner
- `tracking_url`: Link to track request

### MAINTENANCE_REQUEST_RESOLVED
- `tenant_name`: Tenant's first name
- `unit_number`: Unit/Room number
- `issue_title`: Title of the issue
- `completion_date`: Date of completion
- `completion_notes`: Work details
- `feedback_url`: Link to provide feedback

---

## Testing the Integration

### 1. Create a Test Complaint
```bash
curl -X POST http://localhost:8081/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Water Leak",
    "description": "Bathroom ceiling has water leak",
    "priority": "HIGH",
    "category": "Plumbing"
  }' \
  -H "Authorization: Bearer <tenant-token>" \
  --data-raw 'tenantId=1'
```

### 2. Check Email Logs
```sql
SELECT * FROM email_logs 
WHERE email_type = 'MAINTENANCE_REQUEST_SUBMITTED' 
ORDER BY created_at DESC 
LIMIT 1;
```

### 3. Acknowledge Complaint
```bash
curl -X PUT http://localhost:8081/api/complaints/1/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "ownerMessage": "Will send plumber tomorrow morning"
  }' \
  -H "Authorization: Bearer <owner-token>"
```

### 4. Resolve Complaint
```bash
curl -X PUT http://localhost:8081/api/complaints/1/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "completionNotes": "Ceiling has been repaired and tested"
  }' \
  -H "Authorization: Bearer <owner-token>"
```

---

## Email Flow Diagram

```
Tenant Creates Complaint
         ↓
ComplaintService.createComplaint()
         ↓
Save complaint in DB
         ↓
notificationService.sendMaintenanceRequestEmail()
         ↓
emailEvents.publish(MAINTENANCE_REQUEST_SUBMITTED, ...)
         ↓
Owner receives email ✉️
_____________________________________________________________________________

Owner Acknowledges
         ↓
ComplaintService.acknowledgeComplaint()
         ↓
Update status to IN_PROGRESS
         ↓
notificationService.sendMaintenanceAcknowledgedEmail()
         ↓
emailEvents.publish(MAINTENANCE_REQUEST_ACKNOWLEDGED, ...)
         ↓
Tenant receives email ✉️
_____________________________________________________________________________

Owner Completes Work
         ↓
ComplaintService.resolveComplaint()
         ↓
Update status to RESOLVED
         ↓
notificationService.sendMaintenanceResolvedEmail()
         ↓
emailEvents.publish(MAINTENANCE_REQUEST_RESOLVED, ...)
         ↓
Tenant receives email ✉️
```

---

## Error Handling

All email sending is wrapped in try-catch blocks to ensure:
- Complaint creation succeeds even if email fails
- Clear error messages in logs
- No interruption to business logic

```java
try {
    notificationService.sendMaintenanceRequestEmail(...);
} catch (Exception e) {
    System.err.println("Failed to send email: " + e.getMessage());
    // Continue with other operations
}
```

---

## Deployment Checklist

- [ ] SMTP configured in Superadmin panel
- [ ] All maintenance email templates marked as Active
- [ ] ComplaintService updated with notification calls
- [ ] ComplaintController updated with REST endpoints
- [ ] DTOs created and imported
- [ ] Tests run successfully
- [ ] Email logs show successful sending
- [ ] Emails received in user inboxes

---

## Performance Notes

- Emails sent asynchronously - no blocking
- Database transactions isolated properly
- No impact on complaint creation speed
- EmailSenderWorker processes queue in background
- Large volumes handled efficiently

---

## Next Steps

1. **Update ComplaintService** - Add email sending methods
2. **Update ComplaintController** - Add acknowledgment/resolution endpoints
3. **Test Payment + Maintenance Flow** - Verify all emails work
4. **Monitor Email Logs** - Check delivery status
5. **Setup Scheduled Reminders** - Add rent reminder scheduler

Done! ✅
