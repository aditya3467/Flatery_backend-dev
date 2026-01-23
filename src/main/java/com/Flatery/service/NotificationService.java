package com.Flatery.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.service.EmailEvents;
import com.Flatery.model.Notification;
import com.Flatery.model.User;
import com.Flatery.repository.NotificationRepository;
import com.Flatery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailEvents emailEvents;

    /**
     * Create a new notification
     */
    public Notification createNotification(Long userId, Long senderId, String type, 
                                          String title, String message, String redirectUrl) {
        try {
            System.out.println("Creating notification - UserId: " + userId + ", SenderId: " + senderId + 
                              ", Type: " + type + ", Title: " + title);
            
            Notification notification = new Notification(userId, senderId, type, title, message, redirectUrl);
            Notification saved = notificationRepository.save(notification);
            
            System.out.println("Notification saved successfully with ID: " + saved.getId());
            return saved;
        } catch (Exception e) {
            System.err.println("Error creating notification: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to allow caller to handle
        }
    }

    /**
     * Get all notifications for a user
     */
    public List<Notification> getAllNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notification count
     */
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a specific notification as read
     */
    @Transactional
    public boolean markAsRead(Long notificationId, Long userId) {
        Long safeId = Objects.requireNonNull(notificationId, "notificationId cannot be null");
        Long safeUserId = Objects.requireNonNull(userId, "userId cannot be null");
        Optional<Notification> optionalNotification = notificationRepository.findById(safeId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            // Security check: ensure the notification belongs to the user
            if (notification.getUserId().equals(safeUserId)) {
                notification.setIsRead(true);
                notificationRepository.save(notification);
                return true;
            }
        }
        return false;
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    /**
     * Delete a specific notification
     */
    @Transactional
    public boolean deleteNotification(Long notificationId, Long userId) {
        Long safeId = Objects.requireNonNull(notificationId, "notificationId cannot be null");
        Long safeUserId = Objects.requireNonNull(userId, "userId cannot be null");
        Optional<Notification> optionalNotification = notificationRepository.findById(safeId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            // Security check: ensure the notification belongs to the user
            if (notification.getUserId().equals(safeUserId)) {
                notificationRepository.delete(notification);
                return true;
            }
        }
        return false;
    }

    /**
     * Delete all read notifications for a user (cleanup)
     */
    @Transactional
    public int deleteAllRead(Long userId) {
        return notificationRepository.deleteAllReadByUserId(userId);
    }

    /**
     * Get notification by ID
     */
    public Optional<Notification> getNotificationById(Long notificationId) {
        Long safeId = Objects.requireNonNull(notificationId, "notificationId cannot be null");
        Optional<Notification> result = notificationRepository.findById(safeId);
        return result;
    }

    // ========================================
    // CONVENIENCE METHODS FOR COMMON NOTIFICATIONS
    // ========================================

    /**
     * Notify owner about payment submission
     */
    public Notification notifyPaymentSubmitted(Long ownerId, Long tenantId, String tenantName, Long paymentId) {
        return createNotification(
            ownerId,
            tenantId,
            "PaymentSubmitted",
            "New Payment Submitted",
            String.format("%s has submitted payment proof", tenantName),
            "/frontend/owner/property-config.html#manage-payments"
        );
    }

    /**
     * Notify tenant about payment approval
     */
    public Notification notifyPaymentApproved(Long tenantId, Long ownerId, String month) {
        return createNotification(
            tenantId,
            ownerId,
            "PaymentApproved",
            "Payment Approved",
            String.format("Your payment for %s has been approved", month),
            "/frontend/tenant-dashboard.html#payments"
        );
    }

    /**
     * Notify tenant about payment rejection
     */
    public Notification notifyPaymentRejected(Long tenantId, Long ownerId, String month, String reason) {
        return createNotification(
            tenantId,
            ownerId,
            "PaymentRejected",
            "Payment Rejected",
            String.format("Your payment for %s was rejected. Reason: %s", month, reason),
            "/frontend/tenant-dashboard.html#payments"
        );
    }

    /**
     * Notify tenant about being added
     */
    public Notification notifyTenantAdded(Long tenantId, Long ownerId, String propertyName) {
        return createNotification(
            tenantId,
            ownerId,
            "TenantAdded",
            "Welcome to " + propertyName,
            "Your profile has been created. Please complete your details and upload documents.",
            "/frontend/tenant-profile.html"
        );
    }

    /**
     * Notify owner about maintenance request
     */
    public Notification notifyMaintenanceRequest(Long ownerId, Long tenantId, String tenantName, String issue) {
        return createNotification(
            ownerId,
            tenantId,
            "MaintenanceRequest",
            "New Maintenance Request",
            String.format("%s has raised a maintenance request: %s", tenantName, issue),
            "/frontend/owner/property-config.html#maintenance"
        );
    }

    /**
     * Notify tenant about rent due
     */
    public Notification notifyRentDue(Long tenantId, String dueDate, Double amount) {
        return createNotification(
            tenantId,
            null,
            "ReminderDue",
            "Rent Payment Due",
            String.format("Your rent of ₹%.2f is due on %s", amount, dueDate),
            "/frontend/tenant-dashboard.html#payments"
        );
    }

    /**
     * Notify about profile update
     */
    public Notification notifyProfileUpdate(Long userId, Long updatedBy, String updateType) {
        return createNotification(
            userId,
            updatedBy,
            "ProfileUpdate",
            "Profile Updated",
            String.format("Your %s has been updated", updateType),
            "/frontend/tenant-profile.html"
        );
    }

    // ====== EMAIL NOTIFICATION METHODS ======
    
    /**
     * Send maintenance request submitted email to owner
     */
    public void sendMaintenanceRequestEmail(Long ownerId, String tenantName, String unitNumber,
                                           String issueTitle, String issueDescription, String priority) {
        try {
            Optional<User> ownerOpt = userRepository.findById(Objects.requireNonNull(ownerId, "ownerId cannot be null"));
            if (ownerOpt.isPresent()) {
                User owner = ownerOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("owner_name", owner.getFirstName() != null ? owner.getFirstName() : "Property Owner");
                emailData.put("tenant_name", tenantName);
                emailData.put("unit_number", unitNumber);
                emailData.put("issue_title", issueTitle);
                emailData.put("issue_description", issueDescription);
                emailData.put("priority", priority);
                emailData.put("submission_date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")));
                emailData.put("dashboard_url", "https://flatery.in/owner/property-config.html#maintenance");
                
                emailEvents.publish(EmailType.MAINTENANCE_REQUEST_SUBMITTED, owner.getEmail(), emailData);
                System.out.println("Maintenance request email sent to owner: " + owner.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send maintenance request email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send maintenance request acknowledged email to tenant
     */
    public void sendMaintenanceAcknowledgedEmail(Long tenantId, String issueTitle, String unitNumber, 
                                                String status, String resolutionTime, String ownerMessage) {
        try {
            Optional<User> tenantOpt = userRepository.findById(Objects.requireNonNull(tenantId, "tenantId cannot be null"));
            if (tenantOpt.isPresent()) {
                User tenant = tenantOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("tenant_name", tenant.getFirstName() != null ? tenant.getFirstName() : "Tenant");
                emailData.put("unit_number", unitNumber);
                emailData.put("issue_title", issueTitle);
                emailData.put("status", status);
                emailData.put("resolution_time", resolutionTime);
                emailData.put("owner_message", ownerMessage);
                emailData.put("tracking_url", "https://flatery.in/tenant-dashboard.html#maintenance");
                
                emailEvents.publish(EmailType.MAINTENANCE_REQUEST_ACKNOWLEDGED, tenant.getEmail(), emailData);
                System.out.println("Maintenance acknowledgment email sent to tenant: " + tenant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send maintenance acknowledgment email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send maintenance request resolved email to tenant
     */
    public void sendMaintenanceResolvedEmail(Long tenantId, String issueTitle, String unitNumber, 
                                           String completionNotes) {
        try {
            Optional<User> tenantOpt = userRepository.findById(Objects.requireNonNull(tenantId, "tenantId cannot be null"));
            if (tenantOpt.isPresent()) {
                User tenant = tenantOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("tenant_name", tenant.getFirstName() != null ? tenant.getFirstName() : "Tenant");
                emailData.put("unit_number", unitNumber);
                emailData.put("issue_title", issueTitle);
                emailData.put("completion_date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
                emailData.put("completion_notes", completionNotes);
                emailData.put("feedback_url", "https://flatery.in/tenant-dashboard.html#maintenance");
                
                emailEvents.publish(EmailType.MAINTENANCE_REQUEST_RESOLVED, tenant.getEmail(), emailData);
                System.out.println("Maintenance resolved email sent to tenant: " + tenant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send maintenance resolved email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send rent due reminder email to tenant
     */
    public void sendRentReminderEmail(Long tenantId, String propertyName, String unitNumber, 
                                     Double rentAmount, String dueDate) {
        try {
            Optional<User> tenantOpt = userRepository.findById(Objects.requireNonNull(tenantId, "tenantId cannot be null"));
            if (tenantOpt.isPresent()) {
                User tenant = tenantOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("tenant_name", tenant.getFirstName() != null ? tenant.getFirstName() : "Tenant");
                emailData.put("property_name", propertyName);
                emailData.put("unit_number", unitNumber);
                emailData.put("rent_amount", String.format("%.2f", rentAmount));
                emailData.put("due_date", dueDate);
                emailData.put("payment_url", "https://flatery.in/tenant-dashboard.html#payments");
                
                emailEvents.publish(EmailType.RENT_DUE_REMINDER, tenant.getEmail(), emailData);
                System.out.println("Rent reminder email sent to tenant: " + tenant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send rent reminder email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send rent overdue email to tenant
     */
    public void sendRentOverdueEmail(Long tenantId, String propertyName, String unitNumber, 
                                    Double rentAmount, String dueDate) {
        try {
            Optional<User> tenantOpt = userRepository.findById(Objects.requireNonNull(tenantId, "tenantId cannot be null"));
            if (tenantOpt.isPresent()) {
                User tenant = tenantOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("tenant_name", tenant.getFirstName() != null ? tenant.getFirstName() : "Tenant");
                emailData.put("property_name", propertyName);
                emailData.put("unit_number", unitNumber);
                emailData.put("rent_amount", String.format("%.2f", rentAmount));
                emailData.put("due_date", dueDate);
                emailData.put("payment_url", "https://flatery.in/tenant-dashboard.html#payments");
                
                emailEvents.publish(EmailType.RENT_OVERDUE, tenant.getEmail(), emailData);
                System.out.println("Rent overdue email sent to tenant: " + tenant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send rent overdue email: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send payment confirmation email to tenant
     */
    public void sendPaymentConfirmationEmail(Long tenantId, Double amount, String propertyName, 
                                            String transactionId, String receiptUrl) {
        try {
            Optional<User> tenantOpt = userRepository.findById(Objects.requireNonNull(tenantId, "tenantId cannot be null"));
            if (tenantOpt.isPresent()) {
                User tenant = tenantOpt.get();
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("tenant_name", tenant.getFirstName() != null ? tenant.getFirstName() : "Tenant");
                emailData.put("amount", String.format("%.2f", amount));
                emailData.put("property_name", propertyName);
                emailData.put("transaction_id", transactionId);
                emailData.put("payment_date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")));
                emailData.put("receipt_url", receiptUrl);
                
                emailEvents.publish(EmailType.PAYMENT_CONFIRMATION, tenant.getEmail(), emailData);
                System.out.println("Payment confirmation email sent to tenant: " + tenant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Failed to send payment confirmation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send WhatsApp reminder message. This is a placeholder; integrate with a provider when available.
     */
    public boolean sendWhatsAppReminder(String phoneNumber, String tenantName, String message, String type, Long senderId) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }
        String recipientName = tenantName != null && !tenantName.isBlank() ? tenantName : "Tenant";
        System.out.printf("Sending WhatsApp reminder [%s] to %s (%s) by %s: %s%n",
                type,
                recipientName,
                phoneNumber,
                senderId,
                message);
        return true;
    }
}
