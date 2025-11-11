package com.Flatery.Controller;

import com.Flatery.model.Notification;
import com.Flatery.model.User;
import com.Flatery.service.NotificationService;
import com.Flatery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get current user ID from security context
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
            org.springframework.security.core.userdetails.User userDetails =
                    (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
            String username = userDetails.getUsername();
            // Resolve actual User entity by username/email/phone, then return its numeric ID
            return userRepository.findByUsernameOrEmail(username)
                    .map(User::getId)
                    .orElseGet(() -> userRepository.findByUsername(username)
                            .map(User::getId)
                            .orElse(null));
        }
        return null;
    }

    /**
     * GET /api/notifications
     * Get all notifications for current user
     */
    @GetMapping
    public ResponseEntity<?> getAllNotifications() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            List<Notification> notifications = notificationService.getAllNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch notifications: " + e.getMessage()));
        }
    }

    /**
     * GET /api/notifications/unread
     * Get unread notifications for current user
     */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            List<Notification> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch unread notifications: " + e.getMessage()));
        }
    }

    /**
     * GET /api/notifications/count
     * Get unread notification count
     */
    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            Long count = notificationService.getUnreadCount(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch notification count: " + e.getMessage()));
        }
    }

    /**
     * POST /api/notifications
     * Create a new notification (admin/system use)
     */
    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.parseLong(payload.get("userId").toString());
            Long senderId = payload.get("senderId") != null ? 
                Long.parseLong(payload.get("senderId").toString()) : null;
            String type = payload.get("type").toString();
            String title = payload.get("title").toString();
            String message = payload.get("message").toString();
            String redirectUrl = payload.get("redirectUrl") != null ? 
                payload.get("redirectUrl").toString() : null;

            Notification notification = notificationService.createNotification(
                userId, senderId, type, title, message, redirectUrl
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to create notification: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/notifications/:id/read
     * Mark a specific notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            boolean success = notificationService.markAsRead(id, userId);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Notification not found or access denied"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to mark notification as read: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read for current user
     */
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            int count = notificationService.markAllAsRead(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to mark all as read: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/notifications/:id
     * Delete a specific notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            boolean success = notificationService.deleteNotification(id, userId);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Notification deleted"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Notification not found or access denied"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete notification: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/notifications/clear-read
     * Clear all read notifications for current user
     */
    @DeleteMapping("/clear-read")
    public ResponseEntity<?> clearReadNotifications() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            int count = notificationService.deleteAllRead(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "All read notifications cleared");
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to clear notifications: " + e.getMessage()));
        }
    }

    /**
     * POST /api/notifications/test
     * Test notification creation for debugging
     */
    @PostMapping("/test")
    public ResponseEntity<?> testNotification(@RequestParam Long recipientId, 
                                            @RequestParam(required = false) Long senderId) {
        try {
            System.out.println("=== TEST NOTIFICATION ENDPOINT ===");
            System.out.println("Recipient ID: " + recipientId);
            System.out.println("Sender ID: " + senderId);
            
            Notification notification = notificationService.createNotification(
                recipientId,
                senderId != null ? senderId : 1L,
                "TestPaymentApproved", 
                "Test Payment Approved ✅",
                "This is a test notification for payment verification debugging.",
                "/tenant-dashboard.html"
            );
            
            System.out.println("Test notification created with ID: " + notification.getId());
            return ResponseEntity.ok(Map.of(
                "message", "Test notification created successfully",
                "notificationId", notification.getId(),
                "recipientId", recipientId
            ));
        } catch (Exception e) {
            System.err.println("Test notification failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create test notification: " + e.getMessage()));
        }
    }
}
