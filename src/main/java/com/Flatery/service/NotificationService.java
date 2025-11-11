package com.Flatery.service;

import com.Flatery.model.Notification;
import com.Flatery.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Create a new notification
     */
    public Notification createNotification(Long userId, Long senderId, String type, 
                                          String title, String message, String redirectUrl) {
        Notification notification = new Notification(userId, senderId, type, title, message, redirectUrl);
        return notificationRepository.save(notification);
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
        Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            // Security check: ensure the notification belongs to the user
            if (notification.getUserId().equals(userId)) {
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
        Optional<Notification> optionalNotification = notificationRepository.findById(notificationId);
        if (optionalNotification.isPresent()) {
            Notification notification = optionalNotification.get();
            // Security check: ensure the notification belongs to the user
            if (notification.getUserId().equals(userId)) {
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
        return notificationRepository.findById(notificationId);
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
}
