package com.Flatery.Controller.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.AddMultipleTenantsRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
import com.Flatery.dto.tenant.TenantPropertyDetails;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.tenant.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> addTenant(@Valid @RequestBody AddTenantRequest request,
                                       Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            TenantResponse response = tenantService.addTenant(ownerId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Failed to add tenant"));
        }
    }

    @PostMapping("/multiple")
    public ResponseEntity<?> addMultipleTenants(@Valid @RequestBody AddMultipleTenantsRequest request,
                                                Authentication authentication) {
        try {
            request.validatePrimaryTenant();
            Long ownerId = getAuthenticatedUserId(authentication);
            List<TenantResponse> responses = tenantService.addMultipleTenants(ownerId, request.getTenants());
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Failed to add tenants"));
        }
    }

    @GetMapping
    public ResponseEntity<List<TenantSummary>> getOwnerTenants(Authentication authentication) {
        Long ownerId = getAuthenticatedUserId(authentication);
        return ResponseEntity.ok(tenantService.getOwnerTenants(ownerId));
    }

    @GetMapping("/flats")
    public ResponseEntity<List<TenantSummary>> getOwnerFlatTenants(Authentication authentication) {
        Long ownerId = getAuthenticatedUserId(authentication);
        return ResponseEntity.ok(tenantService.getOwnerFlatTenants(ownerId));
    }

    @GetMapping("/me")
    public ResponseEntity<TenantSummary> getCurrentTenantInfo(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        return ResponseEntity.ok(tenantService.getCurrentTenantInfo(username));
    }

    @GetMapping("/me/unit")
    public ResponseEntity<?> getCurrentTenantUnit(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        try {
            var unit = tenantService.getTenantUnit(username);
            return ResponseEntity.ok(Map.of(
                "id", unit.getId(),
                "code", unit.getCode(),
                "type", unit.getType() != null ? unit.getType().toString() : "N/A"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("code", "N/A"));
        }
    }

    @GetMapping("/me/property")
    public ResponseEntity<TenantPropertyDetails> getCurrentTenantProperty(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        return ResponseEntity.ok(tenantService.getTenantPropertyDetails(username));
    }

    @GetMapping("/check-active-tenancy")
    public ResponseEntity<?> checkActiveTenancy(
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String email,
            Authentication authentication) {
        try {
            getAuthenticatedUserId(authentication); // Ensure authenticated
            
            if ((phoneNumber == null || phoneNumber.isBlank()) && (email == null || email.isBlank())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Either phoneNumber or email must be provided"));
            }
            
            var activeTenancy = tenantService.findActiveTenancy(phoneNumber, email);
            if (activeTenancy != null) {
                return ResponseEntity.ok(Map.of(
                    "hasActiveTenancy", true,
                    "propertyName", activeTenancy.getPropertyName(),
                    "propertyId", activeTenancy.getPropertyId(),
                    "tenantName", activeTenancy.getTenantName()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("No active tenancy found"));
            }
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error checking active tenancy"));
        }
    }

    // ...existing code...

    // Debug/Utility: list tenants for a specific unit to verify occupancy
    @GetMapping("/by-unit/{unitId}")
    public ResponseEntity<List<TenantSummary>> getTenantsByUnit(
        @PathVariable Long unitId,
        Authentication authentication
    ) {
    getAuthenticatedUserId(authentication); // ensure authenticated
    return ResponseEntity.ok(tenantService.getTenantsByUnit(unitId));
    }

    @PostMapping("/{tenantId}/deactivate")
    public ResponseEntity<?> deactivateTenant(
            @PathVariable String tenantId,
            Authentication authentication
    ) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            TenantSummary updated = tenantService.deactivateTenant(ownerId, tenantId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (RuntimeException ex) {
            // Permission errors
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to deactivate tenant"));
        }
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        return user.getId();
    }

    public record ErrorResponse(String error) {}
}
