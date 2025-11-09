package com.Flatery.Controller.property;

import com.Flatery.dto.property.CreatePropertyRequest;
import com.Flatery.dto.property.ImageUploadResponse;
import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.dto.property.UpdatePropertyRequest;
import com.Flatery.model.User;
import com.Flatery.model.property.PropertyImage;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyImageRepository;
import com.Flatery.service.property.FileStorageService;
import com.Flatery.service.property.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/properties")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
@lombok.extern.slf4j.Slf4j
public class AdminPropertyController {

    private final PropertyService propertyService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PropertyImageRepository propertyImageRepository;

        // Get total active security deposits for the authenticated owner
        @GetMapping("/security-deposits")
        public ResponseEntity<Integer> getTotalSecurityDeposits(Authentication auth) {
            Long ownerId = getUserId(auth);
            int totalDeposits = propertyService.getTotalActiveSecurityDeposits(ownerId);
            return ResponseEntity.ok(totalDeposits);
        }

    // Create new property (owner = current admin)
    @PostMapping
    public ResponseEntity<PropertyResponse> create(
            @Valid @RequestBody CreatePropertyRequest req,
            Authentication auth
    ) {
        Long ownerId = getUserId(auth);
        PropertyResponse res = propertyService.create(req, ownerId);
        return ResponseEntity.status(201).body(res);
    }

    // Update existing property (must belong to admin unless SUPERADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePropertyRequest req,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        PropertyResponse res = propertyService.update(id, req, userId);
        return ResponseEntity.ok(res);
    }

    // Delete property
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        propertyService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Get one of my properties (or any if SUPERADMIN)
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getOne(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        PropertyResponse res = propertyService.getByIdForOwner(id, userId);
        return ResponseEntity.ok(res);
    }

    // List my properties (or all if SUPERADMIN uses query param ?all=true)
    @GetMapping
    public ResponseEntity<Page<PropertySummary>> listMine(
            @RequestParam(value = "all", defaultValue = "false") boolean all,
            Authentication auth,
            Pageable pageable
    ) {
        Long userId = getUserId(auth);
        Page<PropertySummary> page = propertyService.listForOwner(userId, all, pageable);
        return ResponseEntity.ok(page);
    }

    // Upload images for a property
    @PostMapping(value = "/{id}/images")
    public ResponseEntity<ImageUploadResponse> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        log.info("Upload images request: propertyId={}, userId={}, filesCount={}", id, userId, files != null ? files.size() : null);
        
        if (files == null || files.isEmpty()) {
            log.warn("No files received for upload: propertyId={}, userId={}", id, userId);
            return ResponseEntity.badRequest()
                    .body(new ImageUploadResponse(List.of(), "No files provided for upload"));
        }
        
        // Verify property ownership
        PropertyResponse property = propertyService.getByIdForOwner(id, userId);
        
        // Validate max 10 images
        long existingCount = propertyImageRepository.countByPropertyId(id);
        if (existingCount + files.size() > 10) {
            log.warn("Image upload limit exceeded: propertyId={}, existingCount={}, incoming={}", id, existingCount, files.size());
            return ResponseEntity.badRequest()
                    .body(new ImageUploadResponse(null, "Maximum 10 images allowed per property"));
        }
        
        // Store files and create image records
        List<String> imageUrls = new ArrayList<>();
        int position = (int) existingCount;
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = fileStorageService.storeFile(file, id);
                log.info("Stored image for property {} at {} (original: {})", id, url, file.getOriginalFilename());
                
                PropertyImage image = PropertyImage.builder()
                        .propertyId(id)
                        .url(url)
                        .position(position++)
                        .primaryImage(existingCount == 0 && imageUrls.isEmpty()) // First image is primary
                        .build();
                
                propertyImageRepository.save(image);
                imageUrls.add(url);
            }
        }
        log.info("Completed image upload: propertyId={}, uploadedCount={}", id, imageUrls.size());
        return ResponseEntity.ok(new ImageUploadResponse(imageUrls, 
                "Successfully uploaded " + imageUrls.size() + " image(s)"));
    }

    // Get images for a property
    @GetMapping("/{id}/images")
    public ResponseEntity<List<PropertyImage>> getImages(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        // Verify ownership
        propertyService.getByIdForOwner(id, userId);
        
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(id);
        return ResponseEntity.ok(images);
    }

    // Delete an image
    @DeleteMapping("/{propertyId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long propertyId,
            @PathVariable Long imageId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        // Verify ownership
        propertyService.getByIdForOwner(propertyId, userId);
        
        PropertyImage image = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        
        if (!image.getPropertyId().equals(propertyId)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Delete file from disk
        fileStorageService.deleteFile(image.getUrl());
        
        // Delete from database
        propertyImageRepository.delete(image);
        
        return ResponseEntity.noContent().build();
    }

    // Set a primary image for a property
    @PutMapping("/{propertyId}/images/{imageId}/primary")
    @Transactional
    public ResponseEntity<Void> setPrimaryImage(
            @PathVariable Long propertyId,
            @PathVariable Long imageId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        // Verify ownership
        propertyService.getByIdForOwner(propertyId, userId);

        PropertyImage image = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        if (!image.getPropertyId().equals(propertyId)) {
            return ResponseEntity.badRequest().build();
        }

        // Unset all primaries for this property
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(propertyId);
        for (PropertyImage pi : images) {
            if (pi.isPrimaryImage()) {
                pi.setPrimaryImage(false);
                propertyImageRepository.save(pi);
            }
        }
        // Set the selected image as primary
        image.setPrimaryImage(true);
        propertyImageRepository.save(image);

        return ResponseEntity.noContent().build();
    }

    // Extract user id from Authentication principal (adapt to your JWT principal)
    private Long getUserId(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return user.getId();
    }
}
