package com.Flatery.Controller.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
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

    @GetMapping
    public ResponseEntity<List<TenantSummary>> getOwnerTenants(Authentication authentication) {
        Long ownerId = getAuthenticatedUserId(authentication);
        return ResponseEntity.ok(tenantService.getOwnerTenants(ownerId));
    }

    // Debug/Utility: list tenants for a specific unit to verify occupancy
    @GetMapping("/by-unit/{unitId}")
    public ResponseEntity<List<TenantSummary>> getTenantsByUnit(
        @PathVariable Long unitId,
        Authentication authentication
    ) {
    getAuthenticatedUserId(authentication); // ensure authenticated
    return ResponseEntity.ok(tenantService.getTenantsByUnit(unitId));
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        return user.getId();
    }

    public record ErrorResponse(String error) {}
}
