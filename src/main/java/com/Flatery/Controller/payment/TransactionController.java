package com.Flatery.Controller.payment;

import com.Flatery.dto.payment.PaymentRequestDto;
import com.Flatery.dto.payment.TransactionResponseDto;
import com.Flatery.model.User;
import com.Flatery.model.payment.PaymentStatus;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.tenant.TenantRepository;
import com.Flatery.service.payment.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    /**
     * Tenant submits manual payment proof (UPI or CASH)
     */
    @PostMapping
    public ResponseEntity<?> createTransaction(
            @Valid @RequestBody PaymentRequestDto requestDto,
            Authentication authentication) {
        try {
            // Get authenticated username (phone number)
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            
            System.out.println("=== Transaction Creation Debug ===");
            System.out.println("Username: " + username);
            System.out.println("Payment Request: amount=" + requestDto.getAmount() + 
                             ", mode=" + requestDto.getPaymentMode() + 
                             ", month=" + requestDto.getPaymentMonth());

            // Fetch tenant record by phone number
            Tenant tenant = tenantRepository.findByPhoneNumber(username)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found for user: " + username));

            System.out.println("Tenant found: id=" + tenant.getId() + 
                             ", ownerId=" + tenant.getOwnerId() + 
                             ", propertyId=" + tenant.getPropertyId());

            // Extract required IDs from tenant entity
            Long tenantEntityId = tenant.getId();
            Long ownerId = tenant.getOwnerId();
            Long propertyId = tenant.getPropertyId();

            // Validate required fields
            if (ownerId == null) {
                System.out.println("ERROR: Owner ID is null for tenant: " + tenantEntityId);
                return ResponseEntity.badRequest().body(new ErrorResponse("Tenant record is missing owner_id. Please contact administrator."));
            }
            if (propertyId == null) {
                System.out.println("ERROR: Property ID is null for tenant: " + tenantEntityId);
                return ResponseEntity.badRequest().body(new ErrorResponse("Tenant record is missing property_id. Please contact administrator."));
            }

            System.out.println("Creating transaction with tenantId=" + tenantEntityId + 
                             ", ownerId=" + ownerId + ", propertyId=" + propertyId);

            // Create transaction via service
            TransactionResponseDto response = transactionService.createManualPayment(
                    requestDto, tenantEntityId, ownerId, propertyId);

            System.out.println("Transaction created successfully: id=" + response.getId());
            System.out.println("=================================");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            System.out.println("IllegalArgumentException: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            System.out.println("Exception: " + ex.getMessage());
            ex.printStackTrace(); // Log full stack trace
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to create transaction: " + ex.getMessage()));
        }
    }

    /**
     * Owner fetches pending transactions for verification
     */
    @GetMapping("/owner/pending")
    public ResponseEntity<List<TransactionResponseDto>> getPendingTransactionsForOwner(Authentication authentication) {
        Long ownerId = getAuthenticatedUserId(authentication);
        List<TransactionResponseDto> transactions = transactionService.getTransactionsByOwnerAndStatus(
                ownerId, PaymentStatus.PENDING);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Owner fetches all transactions (any status) for their properties
     */
    @GetMapping("/owner/all")
    public ResponseEntity<List<TransactionResponseDto>> getAllTransactionsForOwner(Authentication authentication) {
        Long ownerId = getAuthenticatedUserId(authentication);
        List<TransactionResponseDto> transactions = transactionService.getTransactionsByOwnerId(ownerId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Tenant fetches their own transaction history
     */
    @GetMapping("/tenant/my-payments")
    public ResponseEntity<?> getMyPayments(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();

            Tenant tenant = tenantRepository.findByPhoneNumber(username)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

            List<TransactionResponseDto> transactions = transactionService.getTransactionsByTenantId(tenant.getId());
            return ResponseEntity.ok(transactions);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Owner verifies a payment transaction
     */
    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyTransaction(@PathVariable Long id, Authentication authentication) {
        try {
            System.out.println("=== CONTROLLER: VERIFY TRANSACTION ===");
            System.out.println("Transaction ID: " + id);
            
            Long ownerId = getAuthenticatedUserId(authentication);
            System.out.println("Owner ID: " + ownerId);
            
            TransactionResponseDto updated = transactionService.verifyTransaction(id, ownerId);
            System.out.println("Transaction verification successful");
            return ResponseEntity.ok(updated);
        } catch (SecurityException ex) {
            System.err.println("SecurityException in verify: " + ex.getMessage());
            return ResponseEntity.status(403).body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            System.err.println("IllegalArgumentException in verify: " + ex.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("Unexpected error in verify transaction controller: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Internal server error: " + ex.getMessage()));
        }
    }

    /**
     * Owner rejects a payment transaction
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectTransaction(@PathVariable Long id, Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            TransactionResponseDto updated = transactionService.rejectTransaction(id, ownerId);
            return ResponseEntity.ok(updated);
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Tenant withdraws/cancels their own pending payment submission
     */
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawTransaction(@PathVariable Long id, Authentication authentication) {
        try {
            System.out.println("=== Withdraw Transaction Request ===");
            System.out.println("Transaction ID: " + id);
            
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String username = userDetails.getUsername();
            System.out.println("Username: " + username);

            Tenant tenant = tenantRepository.findByPhoneNumber(username)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
            
            System.out.println("Tenant found: id=" + tenant.getId());

            TransactionResponseDto updated = transactionService.withdrawTransaction(id, tenant.getId());
            
            System.out.println("Transaction withdrawn successfully: " + updated.getId());
            System.out.println("====================================");
            
            return ResponseEntity.ok(updated);
        } catch (SecurityException ex) {
            System.err.println("SecurityException during withdrawal: " + ex.getMessage());
            return ResponseEntity.status(403).body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            System.err.println("IllegalArgumentException during withdrawal: " + ex.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("Unexpected error during withdrawal: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to withdraw transaction: " + ex.getMessage()));
        }
    }

    /**
     * Owner creates a pre-approved payment for tenant (e.g., initial rent)
     */
    @PostMapping("/owner/create-approved")
    public ResponseEntity<?> createApprovedPayment(
            @Valid @RequestBody PaymentRequestDto requestDto,
            Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            
            System.out.println("=== Owner Creating Pre-Approved Payment ===");
            System.out.println("Owner ID: " + ownerId);
            System.out.println("Tenant ID: " + requestDto.getTenantId());
            System.out.println("Amount: " + requestDto.getAmount());
            
            // Create pre-approved transaction
            TransactionResponseDto response = transactionService.createOwnerApprovedPayment(
                    requestDto, ownerId);
            
            System.out.println("Pre-approved payment created: id=" + response.getId());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException ex) {
            System.out.println("IllegalArgumentException: " + ex.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            System.out.println("Exception: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to create payment: " + ex.getMessage()));
        }
    }

    /**
     * Get payment status for all tenants in a property (for testing the new system)
     */
    @GetMapping("/payment-status/property/{propertyId}")
    public ResponseEntity<?> getPaymentStatusByProperty(@PathVariable Long propertyId, Authentication authentication) {
        try {
            System.out.println("=== GET PAYMENT STATUS FOR PROPERTY: " + propertyId + " ===");
            
            // This would require a new service method - for now just return a placeholder
            return ResponseEntity.ok(Map.of(
                "message", "Payment status endpoint - implementation pending",
                "propertyId", propertyId,
                "note", "Use this endpoint after implementing payment status service methods"
            ));
            
        } catch (Exception ex) {
            System.err.println("Error getting payment status: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to get payment status: " + ex.getMessage()));
        }
    }

    /**
     * Admin endpoint to cleanup invalid auto-generated payments
     * Only removes payments that were auto-generated for non-primary tenants
     */
    @PostMapping("/admin/cleanup-invalid-auto-payments")
    public ResponseEntity<?> cleanupInvalidAutoGeneratedPayments(Authentication authentication) {
        try {
            System.out.println("=== CLEANUP INVALID AUTO-GENERATED PAYMENTS ===");
            
            // Note: In a real application, you'd want proper admin authorization here
            // For now, any authenticated user can call this
            Long userId = getAuthenticatedUserId(authentication);
            System.out.println("Cleanup requested by user ID: " + userId);
            
            int deletedCount = transactionService.cleanupInvalidAutoGeneratedPayments();
            
            String message = "Successfully cleaned up " + deletedCount + " invalid auto-generated payments";
            System.out.println(message);
            
            return ResponseEntity.ok(Map.of(
                "message", message,
                "deletedCount", deletedCount
            ));
            
        } catch (Exception ex) {
            System.err.println("Error during cleanup: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to cleanup: " + ex.getMessage()));
        }
    }

    /**
     * Helper method to get authenticated user's ID
     */
    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow(
                () -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    public record ErrorResponse(String error) {}
}
