package com.Flatery.superadmin.controller;

import com.Flatery.model.User;
import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.PropertyModerationDto;
import com.Flatery.superadmin.dto.PropertyListResponse;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import com.Flatery.superadmin.service.PropertyModerationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for property moderation in SuperAdmin panel
 */
@RestController
@RequestMapping("/api/superadmin/properties")
@RequiredArgsConstructor
@Slf4j
public class PropertyModerationController {

    private final PropertyModerationService propertyModerationService;
    private final SuperAdminGuard superAdminGuard;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    /**
     * Get paginated list of all properties with filters
     */
    @GetMapping
    public ResponseEntity<PropertyListResponse> getAllProperties(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        log.info("SuperAdmin {} accessing property list (page={}, size={})", admin.getUsername(), page, size);
        auditLogService.logAction(admin, "VIEW_PROPERTIES", null, null, 
            "Viewed property list - page " + page, request);
        
        PropertyListResponse response = propertyModerationService.getAllProperties(
                page, size, status, type, verified, search);
        return ResponseEntity.ok(response);
    }

    /**
     * Get property details by ID
     */
    @GetMapping("/{propertyId}")
    public ResponseEntity<PropertyModerationDto> getPropertyById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long propertyId,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        log.info("SuperAdmin {} accessing property details (propertyId={})", admin.getUsername(), propertyId);
        auditLogService.logAction(admin, "VIEW_PROPERTY_DETAILS", "Property", propertyId, 
            "Viewed property details", request);
        
        PropertyModerationDto property = propertyModerationService.getPropertyById(propertyId);
        return ResponseEntity.ok(property);
    }

    /**
     * Update property status (approve/block)
     */
    @PutMapping("/{propertyId}/status")
    public ResponseEntity<String> updatePropertyStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long propertyId,
            @RequestParam PropertyStatus status,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        propertyModerationService.updatePropertyStatus(propertyId, status);
        
        log.info("SuperAdmin {} updated property {} status to {}", admin.getUsername(), propertyId, status);
        auditLogService.logAction(admin, "UPDATE_PROPERTY_STATUS", "Property", propertyId, 
            "Updated property status to " + status, request);
        
        return ResponseEntity.ok("Property status updated successfully");
    }

    /**
     * Verify/Unverify property
     */
    @PutMapping("/{propertyId}/verify")
    public ResponseEntity<String> verifyProperty(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long propertyId,
            @RequestParam boolean verified,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        propertyModerationService.verifyProperty(propertyId, verified);
        
        log.info("SuperAdmin {} set property {} verification to {}", admin.getUsername(), propertyId, verified);
        auditLogService.logAction(admin, "VERIFY_PROPERTY", "Property", propertyId, 
            "Set property verification to " + verified, request);
        
        return ResponseEntity.ok("Property verification updated successfully");
    }
}
