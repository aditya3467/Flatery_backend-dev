package com.Flatery.Controller.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.AddMultipleTenantsRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
import com.Flatery.dto.tenant.TenantPropertyDetails;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.model.tenant.TenancyHistory;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.model.property.Property;
import com.Flatery.service.tenant.TenantService;
import com.Flatery.service.tenant.TenancyHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final TenancyHistoryService tenancyHistoryService;
    private final PropertyRepository propertyRepository;

    @PostMapping
    public ResponseEntity<?> addTenant(@Valid @RequestBody AddTenantRequest request,
                                       Authentication authentication) {
        try {
            System.out.println("=== ADD TENANT REQUEST RECEIVED ===");
            System.out.println("Tenant Name: " + request.getTenantName());
            System.out.println("Phone Number: " + request.getPhoneNumber());
            System.out.println("Email: " + request.getEmailAddress());
            System.out.println("Property ID: " + request.getPropertyId());
            System.out.println("Room Number: " + request.getFlatRoomNumber());
            System.out.println("Rent Amount: " + request.getRentAmount());
            System.out.println("Security Deposit: " + request.getSecurityDeposit());
            System.out.println("Rent Due Date: " + request.getRentDueDate());
            System.out.println("Lease Start: " + request.getLeaseStartDate());
            System.out.println("Lease End: " + request.getLeaseEndDate());
            System.out.println("Unit ID: " + request.getUnitId());
            System.out.println("Bed Index: " + request.getBedIndex());
            System.out.println("Primary: " + request.getPrimary());
            System.out.println("====================================");
            
            Long ownerId = getAuthenticatedUserId(authentication);
            System.out.println("Owner ID from auth: " + ownerId);
            
            TenantResponse response = tenantService.addTenant(ownerId, request);
            
            System.out.println("=== TENANT CREATED SUCCESSFULLY ===");
            System.out.println("Response: " + response);
            System.out.println("====================================");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            System.err.println("=== VALIDATION ERROR ===");
            System.err.println("Message: " + ex.getMessage());
            ex.printStackTrace();
            System.err.println("========================");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            System.err.println("=== UNEXPECTED ERROR ===");
            System.err.println("Type: " + ex.getClass().getName());
            System.err.println("Message: " + ex.getMessage());
            ex.printStackTrace();
            System.err.println("========================");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Failed to add tenant: " + ex.getMessage()));
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

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateTenant(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            TenantSummary updatedTenant = tenantService.updateTenant(id, ownerId, updates);
            return ResponseEntity.ok(updatedTenant);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("Failed to update tenant"));
        }
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
        try {
            return ResponseEntity.ok(tenantService.getTenantPropertyDetails(username));
        } catch (IllegalStateException ex) {
            // No active tenancy for this user
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        } catch (IllegalArgumentException ex) {
            // Tenant not found / property not found
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
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
            @RequestBody(required = false) VacateTenantRequest request,
            Authentication authentication
    ) {
        try {
            Long ownerId = getAuthenticatedUserId(authentication);
            String reason = (request != null && request.vacateReason() != null) 
                    ? request.vacateReason() 
                    : "Owner initiated deactivation";
            
            Map<String, Object> response = tenantService.deactivateTenant(ownerId, tenantId, reason);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
        } catch (RuntimeException ex) {
            // Permission errors
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to deactivate tenant: " + ex.getMessage()));
        }
    }

    // TEMPORARILY COMMENTED OUT - REFERENCES NON-EXISTENT SERVICE METHOD
    /*
    @GetMapping("/check-exists")
    public ResponseEntity<?> checkTenantExists(
            @RequestParam String phoneNumber,
            Authentication authentication) {
        try {
            getAuthenticatedUserId(authentication); // Ensure authenticated
            
            List<TenantSummary> existingTenants = tenantService.findTenantsByPhone(phoneNumber);
            
            Map<String, Object> response = new HashMap<>();
            response.put("exists", !existingTenants.isEmpty());
            response.put("tenants", existingTenants);
            
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to check tenant existence"));
        }
    }
    */



    /**
     * Get tenancy history for a tenant by phone number
     */
    @GetMapping("/history/phone/{phoneNumber}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> getTenantHistory(
            @PathVariable String phoneNumber,
            Authentication authentication) {
        try {
            getAuthenticatedUserId(authentication); // Ensure authenticated
            
            List<TenancyHistory> history = tenancyHistoryService.getTenantHistory(phoneNumber);
            
            Map<String, Object> response = new HashMap<>();
            response.put("phoneNumber", phoneNumber);
            response.put("totalTenancies", history.size());
            response.put("history", history);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to get tenant history: " + ex.getMessage()));
        }
    }

    /**
     * Get payment status for a specific tenant
     */
    @GetMapping("/{tenantId}/payment-status")
    @PreAuthorize("hasAnyRole('OWNER', 'TENANT')")
    public ResponseEntity<?> getTenantPaymentStatus(
            @PathVariable Long tenantId,
            Authentication authentication) {
        try {
            // TODO: Add authorization check - owner owns tenant or tenant is self
            Map<String, Object> status = tenantService.getTenantPaymentStatus(tenantId);
            return ResponseEntity.ok(status);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to get payment status: " + ex.getMessage()));
        }
    }

    /**
     * Get payment history for a tenant
     */
    @GetMapping("/{tenantId}/payment-history")
    @PreAuthorize("hasAnyRole('OWNER', 'TENANT')")
    public ResponseEntity<?> getTenantPaymentHistory(
            @PathVariable Long tenantId,
            @RequestParam(defaultValue = "12") int months,
            Authentication authentication) {
        try {
            // TODO: Add authorization check - owner owns tenant or tenant is self
            List<Map<String, Object>> history = tenantService.getTenantPaymentHistory(tenantId, months);
            return ResponseEntity.ok(history);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to get payment history: " + ex.getMessage()));
        }
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username).orElseThrow();
        return user.getId();
    }

        /**
         * Get past stays/tenancy history for the current tenant
         */
        @GetMapping("/me/past-stays")
        @PreAuthorize("hasAnyRole('TENANT','USER')")
        public ResponseEntity<?> getTenantPastStays(Authentication authentication) {
            try {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                String username = userDetails.getUsername();
                User user = userRepository.findByUsername(username).orElseThrow();

                // Use phone number if present, else fallback to username (many tenants use phone as username)
                String phone = user.getPhoneNumber() != null ? user.getPhoneNumber() : username;

                // Get past stays for this user
                List<TenancyHistory> pastStays = tenancyHistoryService.getTenantHistory(phone);

                // Map to lightweight DTO for frontend
                List<Map<String, Object>> dtoList = pastStays.stream().map(history -> {
                    Map<String, Object> map = new HashMap<>();

                    Property property = null;
                    try {
                        property = propertyRepository.findById(history.getPropertyId()).orElse(null);
                    } catch (Exception ignore) {}

                    map.put("propertyName", property != null ? property.getName() : "Unknown Property");
                    map.put("city", property != null ? property.getCity() : "Unknown Location");

                    // Prefer moveIn/moveOut; fallback to tenancyStart/End
                    map.put("startDate", history.getMoveInDate() != null
                            ? history.getMoveInDate()
                            : (history.getTenancyStartDate() != null ? history.getTenancyStartDate().toLocalDate() : null));
                    map.put("endDate", history.getMoveOutDate() != null
                            ? history.getMoveOutDate()
                            : (history.getTenancyEndDate() != null ? history.getTenancyEndDate().toLocalDate() : null));

                    map.put("status", "Completed");
                    map.put("isActive", false);

                    return map;
                }).toList();

                return ResponseEntity.ok(dtoList);
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ErrorResponse("Failed to get past stays: " + ex.getMessage()));
            }
        }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            System.err.println("Validation Error - Field: " + fieldName + ", Message: " + errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    public record ErrorResponse(String error) {}
    
    public record VacateTenantRequest(
            String vacateReason
    ) {}
}
