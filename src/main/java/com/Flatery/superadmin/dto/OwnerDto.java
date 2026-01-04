package com.Flatery.superadmin.dto;

import com.Flatery.model.RoleName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO for Owner information in SuperAdmin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerDto {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Set<RoleName> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Statistics
    private Long totalProperties;
    private Long activeProperties;
    private Long totalTenants;
    private Long activeTenants;
    
    // Status
    private Boolean isActive;
    private Boolean isVerified;
}
