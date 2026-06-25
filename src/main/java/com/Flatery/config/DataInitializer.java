package com.Flatery.config;

import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Initializes default super admin user on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private boolean initialized = false;  // flag to run only once per application run

    @Override
    public void run(ApplicationArguments args) {
        if (!initialized) {
            initializeSuperAdmin();
            initialized = true;
        }
    }

    private void initializeSuperAdmin() {
        String superAdminUsername = "Superadmin";

        if (userRepository.findByUsername(superAdminUsername).isPresent()) {
            log.debug("Super admin user already exists");
            return;
        }

        User superAdmin = new User();
        superAdmin.setUsername(superAdminUsername);
        superAdmin.setPassword(passwordEncoder.encode("Admin123"));
        superAdmin.setEmail("superadmin@flatery.com");
        superAdmin.setFirstName("Super");
        superAdmin.setLastName("Admin");
        superAdmin.setPhoneNumber("0000000000");
        superAdmin.setRoles(Set.of(RoleName.SUPERADMIN, RoleName.ADMIN));
        superAdmin.setVerified(true);
        superAdmin.setEmailVerifiedAt(LocalDateTime.now());

        userRepository.save(superAdmin);
        log.info("Super admin user created successfully with username: {}", superAdminUsername);
    }
}

