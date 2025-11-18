package com.Flatery.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddMultipleTenantsRequest {
    
    @NotEmpty(message = "At least one tenant is required")
    @Size(max = 10, message = "Maximum 10 tenants can be added at once")
    @Valid
    private List<AddTenantRequest> tenants;
    
    // Ensure only one primary tenant is specified
    public void validatePrimaryTenant() {
        long primaryCount = tenants.stream()
                .mapToLong(tenant -> Boolean.TRUE.equals(tenant.getPrimary()) ? 1 : 0)
                .sum();
        
        if (primaryCount != 1) {
            throw new IllegalArgumentException("Exactly one tenant must be marked as primary");
        }
    }
}