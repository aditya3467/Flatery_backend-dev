package com.Flatery.superadmin.controller;

import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.OwnerDto;
import com.Flatery.superadmin.dto.OwnerListResponse;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import com.Flatery.superadmin.service.OwnerManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing owners in SuperAdmin panel
 */
@RestController
@RequestMapping("/api/superadmin/owners")
@RequiredArgsConstructor
@Slf4j
public class OwnerManagementController {

    private final OwnerManagementService ownerManagementService;
    private final SuperAdminGuard superAdminGuard;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    /**
     * Get paginated list of all owners
     */
    @GetMapping
    public ResponseEntity<OwnerListResponse> getAllOwners(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        log.info("SuperAdmin {} accessing owner list (page={}, size={})", admin.getUsername(), page, size);
        auditLogService.logAction(admin, "VIEW_OWNERS", null, null, 
            "Viewed owner list - page " + page, request);
        
        OwnerListResponse response = ownerManagementService.getAllOwners(page, size, sortBy, search);
        return ResponseEntity.ok(response);
    }

    /**
     * Get owner details by ID
     */
    @GetMapping("/{ownerId}")
    public ResponseEntity<OwnerDto> getOwnerById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long ownerId,
            HttpServletRequest request) {
        
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        superAdminGuard.requireSuperAdmin(admin);
        
        log.info("SuperAdmin {} accessing owner details (ownerId={})", admin.getUsername(), ownerId);
        auditLogService.logAction(admin, "VIEW_OWNER_DETAILS", "Owner", ownerId, 
            "Viewed owner details", request);
        
        OwnerDto owner = ownerManagementService.getOwnerById(ownerId);
        return ResponseEntity.ok(owner);
    }
}
