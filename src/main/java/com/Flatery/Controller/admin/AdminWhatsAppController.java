package com.Flatery.Controller.admin;

import com.Flatery.service.NotificationService;
import com.Flatery.service.tenant.TenantService;
import com.Flatery.model.tenant.Tenant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin WhatsApp Controller
 * Handles WhatsApp reminders sent by property owners/admins to tenants
 */
@RestController
@RequestMapping("/api/admin/whatsapp")
@CrossOrigin(origins = "*")
public class AdminWhatsAppController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private TenantService tenantService;

    /**
     * POST /api/admin/whatsapp/rent-reminder
     * Send WhatsApp rent reminder to a specific tenant
     */
    @PostMapping("/rent-reminder")
    public ResponseEntity<?> sendRentReminder(@RequestBody Map<String, Object> requestBody) {
        try {
            // Extract request parameters
            Object tenantIdObj = requestBody.get("tenantId");
            String tenantName = (String) requestBody.get("tenantName");
            String phone = (String) requestBody.get("phone");
            Object propertyIdObj = requestBody.get("propertyId");
            Object amountObj = requestBody.get("amount");

            // Validate required fields
            if (tenantIdObj == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tenant ID is required"));
            }

            if (phone == null || phone.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Phone number is required"));
            }

            // Parse tenant ID
            Long tenantId;
            if (tenantIdObj instanceof Number) {
                tenantId = ((Number) tenantIdObj).longValue();
            } else {
                tenantId = Long.parseLong(tenantIdObj.toString());
            }

            // Get current user (owner/admin)
            Long ownerId = getCurrentUserId();
            if (ownerId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            // Parse amount
            double amount = 0;
            if (amountObj instanceof Number) {
                amount = ((Number) amountObj).doubleValue();
            } else if (amountObj != null) {
                try {
                    amount = Double.parseDouble(amountObj.toString());
                } catch (NumberFormatException e) {
                    amount = 0;
                }
            }

            // Get tenant details if not provided
            if (tenantName == null || tenantName.isEmpty()) {
                try {
                    Tenant tenant = tenantService.getTenantByIdAndOwner(tenantId, ownerId);
                    if (tenant != null) {
                        tenantName = tenant.getTenantName();
                        if (amount == 0 && tenant.getRentAmount() != null) {
                            amount = tenant.getRentAmount();
                        }
                    } else {
                        tenantName = "Tenant";
                    }
                } catch (Exception e) {
                    tenantName = "Tenant";
                }
            }

            // Format phone number
            String formattedPhone = formatPhoneNumber(phone);

            // Create WhatsApp message
            String message = String.format(
                "🏠 *Rent Reminder - Flatery*\n\n" +
                "Dear %s,\n\n" +
                "This is a friendly reminder regarding your rent payment.\n\n" +
                "💰 *Amount Due:* ₹%,.2f\n\n" +
                "Please submit your payment at your earliest convenience. " +
                "If you've already paid, please ignore this message.\n\n" +
                "For any queries, feel free to contact us.\n\n" +
                "Thank you! 🙏",
                tenantName,
                amount
            );

            // Send WhatsApp reminder
            boolean sent = notificationService.sendWhatsAppReminder(
                formattedPhone,
                tenantName,
                message,
                "RENT_REMINDER",
                ownerId
            );

            if (sent) {
                // Also create an in-app notification
                try {
                    notificationService.createNotification(
                        tenantId,
                        ownerId,
                        "RENT_REMINDER",
                        "Rent Payment Reminder",
                        "A rent reminder has been sent via WhatsApp",
                        "/tenant-dashboard.html#payments"
                    );
                } catch (Exception e) {
                    System.err.println("Failed to create in-app notification: " + e.getMessage());
                }

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "WhatsApp reminder sent successfully to " + tenantName,
                    "phone", formattedPhone,
                    "tenantId", tenantId
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Failed to send WhatsApp message",
                        "details", "WhatsApp service returned false. Please check WhatsApp API configuration."
                    ));
            }

        } catch (Exception e) {
            System.err.println("Error sending WhatsApp rent reminder: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Failed to send WhatsApp reminder",
                    "details", e.getMessage()
                ));
        }
    }

    /**
     * Format phone number for WhatsApp API (India format)
     * Adds +91 country code if not present
     */
    private String formatPhoneNumber(String phone) {
        // Remove any non-digit characters
        String cleaned = phone.replaceAll("[^0-9]", "");
        
        // If it's a 10-digit number, add India's country code (91)
        if (cleaned.length() == 10) {
            cleaned = "91" + cleaned;
        }
        
        // If it doesn't start with +, add it
        if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Get current authenticated user ID
     */
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                org.springframework.security.core.userdetails.User user = 
                    (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
                
                // Try to get user ID from username
                String username = user.getUsername();
                // This assumes username might be numeric or you have another way to get user ID
                // Adjust this based on your authentication setup
                return null; // TODO: Implement proper user ID retrieval
            }
        } catch (Exception e) {
            System.err.println("Error getting current user ID: " + e.getMessage());
        }
        return null;
    }
}
