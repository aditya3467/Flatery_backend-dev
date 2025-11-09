package com.Flatery.Tenant.controller;

import com.Flatery.Tenant.dto.TenantProfileRequestDto;
import com.Flatery.Tenant.dto.TenantProfileResponseDto;
import com.Flatery.Tenant.service.TenantProfileService;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for tenant profile operations.
 * Allows a logged-in tenant to create/update or view their profile.
 * Independent from the existing TenantController to avoid side effects.
 */
@RestController
@RequestMapping("/api/tenants/me/profile")
@RequiredArgsConstructor
public class TenantProfileController {

    private final TenantProfileService profileService;
    private final TenantRepository tenantRepository;

    /**
     * Save or update the tenant profile for the logged-in tenant.
     */
    @PostMapping
    public ResponseEntity<TenantProfileResponseDto> saveProfile(
            @RequestBody TenantProfileRequestDto request,
            Authentication authentication) {

        Long tenantId = getTenantIdFromAuth(authentication);
        TenantProfileResponseDto response = profileService.saveOrUpdateProfile(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Fetch tenant profile for the logged-in tenant.
     */
    @GetMapping
    public ResponseEntity<TenantProfileResponseDto> getProfile(Authentication authentication) {
        Long tenantId = getTenantIdFromAuth(authentication);
        TenantProfileResponseDto response = profileService.getProfile(tenantId);
        return ResponseEntity.ok(response);
    }

    // ===========================================================
    // Helper: derive tenant ID from authenticated user
    // ===========================================================
    private Long getTenantIdFromAuth(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();

        Tenant tenant = tenantRepository.findByPhoneNumber(username)
                .orElseGet(() -> tenantRepository.findByEmailAddress(username)
                        .orElseThrow(() -> new RuntimeException("No active tenancy found for user: " + username)));

        return tenant.getId();
    }
}
