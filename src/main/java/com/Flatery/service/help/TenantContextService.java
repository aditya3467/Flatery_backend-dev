package com.Flatery.service.help;

import com.Flatery.model.User;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for extracting user, tenant, owner, and property context from authentication
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantContextService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    /**
     * Get User from authentication
     */
    @Transactional(readOnly = true)
    public User getUserFromAuth(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    /**
     * Get Tenant from authentication
     */
    @Transactional(readOnly = true)
    public Tenant getTenantFromAuth(Authentication authentication) {
        User user = getUserFromAuth(authentication);

        return tenantRepository.findByPhoneNumber(user.getPhoneNumber())
                .or(() -> {
                    if (user.getEmail() != null) {
                        return tenantRepository.findByEmailAddress(user.getEmail());
                    }
                    return Optional.empty();
                })
                .orElseThrow(() -> new RuntimeException(
                        "Tenant record not found for user: " + user.getUsername() +
                                ". User must have an active tenancy assignment to create complaints."));
    }

    /**
     * Extract user ID from authentication
     */
    public Long getUserIdFromAuth(Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return user.getId();
    }

    /**
     * Extract owner ID from tenant record
     */
    public Long getOwnerIdFromAuth(Authentication authentication) {
        Tenant tenant = getTenantFromAuth(authentication);

        if (tenant.getOwnerId() == null) {
            throw new RuntimeException("Tenant is not assigned to any owner. Please contact support.");
        }

        return tenant.getOwnerId();
    }

    /**
     * Extract property ID from tenant record
     */
    public Long getPropertyIdFromAuth(Authentication authentication) {
        Tenant tenant = getTenantFromAuth(authentication);

        if (tenant.getPropertyId() == null) {
            throw new RuntimeException("Tenant is not assigned to any property. Please contact support.");
        }

        return tenant.getPropertyId();
    }

    /**
     * Extract role from authentication
     */
    public String getRoleFromAuth(Authentication authentication) {
        if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_USER"))) {
            return "USER";
        } else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
            return "ADMIN";
        } else if (authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPERADMIN"))) {
            return "SUPERADMIN";
        }
        return "UNKNOWN";
    }

    /**
     * Validate tenant has required assignments
     */
    public void validateTenantAssignment(Tenant tenant) {
        if (tenant.getOwnerId() == null) {
            throw new IllegalStateException("Tenant must be assigned to an owner");
        }
        if (tenant.getPropertyId() == null) {
            throw new IllegalStateException("Tenant must be assigned to a property");
        }
    }

    /**
     * Check if user has tenant role
     */
    public boolean isTenant(Authentication authentication) {
        return authentication.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_USER"));
    }

    /**
     * Check if user has owner role
     */
    public boolean isOwner(Authentication authentication) {
        return authentication.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
}
