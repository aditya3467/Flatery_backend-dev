package com.Flatery.superadmin.security;

import com.Flatery.model.User;
import com.Flatery.model.RoleName;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminGuard {

    /**
     * Check if user is a superadmin
     */
    public boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            User user = (User) principal;
            return user.getRoles() != null && user.getRoles().contains(RoleName.SUPERADMIN);
        }

        return false;
    }

    /**
     * Check if authenticated user is superadmin
     */
    public boolean isSuperAdmin(User user) {
        return user != null && user.getRoles() != null && user.getRoles().contains(RoleName.SUPERADMIN);
    }

    /**
     * Throw exception if not superadmin
     */
    public void requireSuperAdmin(User user) {
        if (!isSuperAdmin(user)) {
            throw new SecurityException("Access denied. SuperAdmin role required.");
        }
    }
    
    /**
     * Static method to check if UserDetails has SUPERADMIN role
     */
    public static void requireSuperAdmin(UserDetails userDetails) {
        if (userDetails == null) {
            throw new SecurityException("Access denied. Authentication required.");
        }
        
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_SUPERADMIN") || role.equals("SUPERADMIN"));
        
        if (!isSuperAdmin) {
            throw new SecurityException("Access denied. SuperAdmin role required.");
        }
    }
}
