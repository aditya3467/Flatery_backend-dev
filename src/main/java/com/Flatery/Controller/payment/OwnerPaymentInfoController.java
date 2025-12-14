package com.Flatery.Controller.payment;

import com.Flatery.dto.payment.OwnerPaymentInfoDto;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.payment.OwnerPaymentInfoService;
import com.Flatery.service.storage.S3StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/owner-payment-info")
@RequiredArgsConstructor
public class OwnerPaymentInfoController {

    private final OwnerPaymentInfoService service;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;

    /**
     * Get payment info for logged-in owner
     */
    @GetMapping
    public ResponseEntity<?> getPaymentInfo(Authentication authentication) {
        System.out.println("=== CONTROLLER METHOD ENTERED ===");
        try {
            System.out.println("=== Getting payment info ===");
            System.out.println("Authentication: " + authentication);
            
            if (authentication == null) {
                System.err.println("Authentication is NULL!");
                return ResponseEntity.status(401).body(new ErrorResponse("Not authenticated"));
            }
            
            System.out.println("Principal: " + authentication.getPrincipal());
            System.out.println("Principal class: " + authentication.getPrincipal().getClass().getName());
            
            Long ownerId = getAuthenticatedUserId(authentication);
            System.out.println("Owner ID: " + ownerId);
            
            return service.getByOwnerId(ownerId)
                    .map(dto -> {
                        System.out.println("Found payment info: " + dto);
                        return ResponseEntity.ok(dto);
                    })
                    .orElseGet(() -> {
                        System.out.println("No payment info found for owner: " + ownerId);
                        return ResponseEntity.noContent().build();
                    });
        } catch (Throwable ex) {
            System.err.println("ERROR in getPaymentInfo: " + ex.getClass().getName() + ": " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("Internal error: " + ex.getMessage()));
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
     * Upload QR code image for owner payment settings
     */
    @PostMapping("/upload-qr")
    public ResponseEntity<?> uploadQRCode(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            System.out.println("=== Upload QR Code endpoint hit ===");
            System.out.println("File: " + file.getOriginalFilename());
            System.out.println("Size: " + file.getSize());
            
            Long ownerId = getAuthenticatedUserId(authentication);
            System.out.println("Owner ID: " + ownerId);
            
            // Get existing payment info to check for old QR
            service.getByOwnerId(ownerId).ifPresent(existingInfo -> {
                if (existingInfo.getQrImageUrl() != null && !existingInfo.getQrImageUrl().isEmpty()) {
                    System.out.println("Deleting old QR: " + existingInfo.getQrImageUrl());
                    try {
                        s3StorageService.deleteFile(existingInfo.getQrImageUrl());
                    } catch (Exception e) {
                        System.err.println("Failed to delete old QR: " + e.getMessage());
                    }
                }
            });
            
            // Upload new QR to S3
            String s3Url = s3StorageService.storeOwnerQRCode(file, ownerId);
            System.out.println("S3 URL: " + s3Url);
            
            // Update payment info with new QR URL
            service.getByOwnerId(ownerId).ifPresentOrElse(
                existingInfo -> {
                    existingInfo.setQrImageUrl(s3Url);
                    service.saveOrUpdate(ownerId, existingInfo);
                    System.out.println("Updated QR URL in database");
                },
                () -> {
                    // Create new payment info with QR URL
                    OwnerPaymentInfoDto newInfo = new OwnerPaymentInfoDto();
                    newInfo.setOwnerId(ownerId);
                    newInfo.setQrImageUrl(s3Url);
                    newInfo.setIsActive(true);
                    service.saveOrUpdate(ownerId, newInfo);
                    System.out.println("Created new payment info with QR URL");
                }
            );
            
            return ResponseEntity.ok(new UploadResponse(s3Url));
        } catch (Exception ex) {
            System.err.println("Error uploading QR code: " + ex.getMessage());
            ex.printStackTrace();
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
    public record UploadResponse(String url) {}
}
