package com.Flatery.Controller.tenant;

import com.Flatery.service.property.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class TenantPaymentController {

    private final FileStorageService fileStorageService;

    /**
     * Upload payment proof screenshot
     * Returns the file URL to be used in transaction submission
     */
    @PostMapping("/me/payment-proof")
    public ResponseEntity<?> uploadPaymentProof(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || 
                !(contentType.equals("image/jpeg") || 
                  contentType.equals("image/png") || 
                  contentType.equals("image/jpg"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only JPEG and PNG images are allowed"));
            }

            // Validate file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File size must be less than 5MB"));
            }

            // Store file in uploads/payment-proofs directory
            // Use a special property ID of 0 for payment proofs
            String fileUrl = fileStorageService.storePaymentProof(file);

            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("message", "Payment proof uploaded successfully");

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to upload file: " + ex.getMessage()));
        }
    }
}
