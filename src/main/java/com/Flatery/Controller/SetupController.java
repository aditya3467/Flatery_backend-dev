package com.Flatery.Controller;

import com.Flatery.model.User;
import com.Flatery.model.RoleName;
import com.Flatery.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/setup")
@CrossOrigin(origins = "*")
public class SetupController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Create superadmin user - ONE TIME SETUP
     * DELETE THIS ENDPOINT AFTER FIRST USE!
     */
    @PostMapping("/create-superadmin")
    public String createSuperAdmin() {
        try {
            // Check if superadmin already exists
            if (userRepository.existsByUsername("superadmin")) {
                return "Superadmin already exists! Use username: superadmin, password: Admin@123";
            }

            // Create superadmin user
            User superAdmin = new User();
            superAdmin.setUsername("superadmin");
            superAdmin.setEmail("admin@flatery.com");
            superAdmin.setPassword(passwordEncoder.encode("Admin@123"));
            superAdmin.setFirstName("Super");
            superAdmin.setLastName("Admin");
            superAdmin.setPhoneNumber("9999999999");
            
            Set<RoleName> roles = new HashSet<>();
            roles.add(RoleName.SUPERADMIN);
            superAdmin.setRoles(roles);
            
            superAdmin.setCreatedAt(LocalDateTime.now());
            superAdmin.setUpdatedAt(LocalDateTime.now());
            superAdmin.setVerified(true);
            superAdmin.setEmailVerifiedAt(LocalDateTime.now());

            userRepository.save(superAdmin);

            log.info("✅ Superadmin created successfully!");

            return "SUCCESS! Superadmin created.\n\n" +
                   "Login Credentials:\n" +
                   "Username: superadmin\n" +
                   "Email: admin@flatery.com\n" +
                   "Password: Admin@123\n\n" +
                   "⚠️ IMPORTANT: Delete this endpoint after use for security!";

        } catch (Exception e) {
            log.error("Failed to create superadmin", e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Check if superadmin exists
     */
    @GetMapping("/check-superadmin")
    public String checkSuperAdmin() {
        boolean exists = userRepository.existsByUsername("superadmin");
        if (exists) {
            var user = userRepository.findByUsername("superadmin");
            if (user.isPresent()) {
                return "Superadmin exists!\n" +
                       "Username: " + user.get().getUsername() + "\n" +
                       "Email: " + user.get().getEmail() + "\n" +
                       "Roles: " + user.get().getRoles();
            }
            return "Superadmin exists! Username: superadmin";
        } else {
            return "No superadmin found. Call POST /api/setup/create-superadmin to create one.";
        }
    }

    /**
     * Reset superadmin password - USE FOR TROUBLESHOOTING
     */
    @PostMapping("/reset-superadmin-password")
    public String resetSuperAdminPassword() {
        try {
            var userOpt = userRepository.findByUsername("superadmin");
            if (userOpt.isEmpty()) {
                return "ERROR: Superadmin user not found! Call /create-superadmin first.";
            }

            User superAdmin = userOpt.get();
            
            // Update password
            superAdmin.setPassword(passwordEncoder.encode("Admin@123"));
            
            // Ensure SUPERADMIN role exists
            Set<RoleName> roles = superAdmin.getRoles();
            if (roles == null) {
                roles = new HashSet<>();
            }
            roles.add(RoleName.SUPERADMIN);
            superAdmin.setRoles(roles);
            
            userRepository.save(superAdmin);

            log.info("✅ Superadmin password reset successfully!");

            return "SUCCESS! Superadmin password reset.\n\n" +
                   "Login Credentials:\n" +
                   "Username: superadmin\n" +
                   "Password: Admin@123\n" +
                   "Roles: " + superAdmin.getRoles();

        } catch (Exception e) {
            log.error("Failed to reset superadmin password", e);
            return "ERROR: " + e.getMessage();
        }
    }
}
