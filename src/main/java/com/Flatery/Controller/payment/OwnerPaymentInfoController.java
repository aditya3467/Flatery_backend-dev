package com.Flatery.Controller.payment;

import com.Flatery.dto.payment.OwnerPaymentInfoDto;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.payment.OwnerPaymentInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner-payment-info")
@RequiredArgsConstructor
public class OwnerPaymentInfoController {

    private final OwnerPaymentInfoService service;
    private final UserRepository userRepository;

    /**
     * Get payment info for logged-in owner
     */
    @GetMapping
    public ResponseEntity<?> getPaymentInfo(Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            return service.getByOwnerId(ownerId)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Create or update payment info for owner
     */
    @PostMapping
    public ResponseEntity<?> savePaymentInfo(
            @Valid @RequestBody OwnerPaymentInfoDto dto,
            Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            OwnerPaymentInfoDto saved = service.saveOrUpdate(ownerId, dto);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Update payment info (PUT request)
     */
    @PutMapping
    public ResponseEntity<?> updatePaymentInfo(
            @Valid @RequestBody OwnerPaymentInfoDto dto,
            Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            OwnerPaymentInfoDto updated = service.saveOrUpdate(ownerId, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Deactivate payment info
     */
    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivatePaymentInfo(Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            service.deactivate(ownerId);
            return ResponseEntity.ok(new MessageResponse("Payment info deactivated successfully"));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Activate payment info
     */
    @PostMapping("/activate")
    public ResponseEntity<?> activatePaymentInfo(Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            service.activate(ownerId);
            return ResponseEntity.ok(new MessageResponse("Payment info activated successfully"));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Check if payment info exists
     */
    @GetMapping("/exists")
    public ResponseEntity<?> checkPaymentInfoExists(Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            boolean exists = service.existsForOwner(ownerId);
            return ResponseEntity.ok(new ExistsResponse(exists));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Helper method to get authenticated user's ID
     */
    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    public record ErrorResponse(String error) {}
    public record MessageResponse(String message) {}
    public record ExistsResponse(boolean exists) {}
}
