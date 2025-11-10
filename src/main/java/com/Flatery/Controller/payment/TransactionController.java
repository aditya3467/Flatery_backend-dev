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

            // Fetch tenant record by phone number
            Tenant tenant = tenantRepository.findByPhoneNumber(username)
                    .orElseThrow(() -> new IllegalArgumentException("Tenant not found for user: " + username));

            // Extract required IDs from tenant entity
            Long tenantEntityId = tenant.getId();
            Long ownerId = tenant.getOwnerId();
            Long propertyId = tenant.getPropertyId();

            // Create transaction via service
            TransactionResponseDto response = transactionService.createManualPayment(
                    requestDto, tenantEntityId, ownerId, propertyId);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to create transaction"));
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
            Long ownerId = getAuthenticatedUserId(authentication);
            TransactionResponseDto updated = transactionService.verifyTransaction(id, ownerId);
            return ResponseEntity.ok(updated);
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
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
