package com.Flatery.service;

import com.Flatery.dto.RegisterRequest;
import com.Flatery.dto.AuthResponse;
import com.Flatery.dto.LoginRequest;
import com.Flatery.exception.EmailNotVerifiedException;
import com.Flatery.model.User;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.tenant.TenantRepository;
import com.Flatery.security.JwtService;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    
    private final UserRepository userRepo;
    private final UserService userService;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
        private final EmailVerificationService emailVerificationService;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String jwtToken = jwtService.generateToken(principal);
        long expiresIn = jwtService.getExpirationTime();

        User user = userRepo.findByUsername(principal.getUsername()).orElseThrow();
        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new EmailNotVerifiedException("Please verify your email.");
        }

        Set<String> roles = user.getRoles().stream().map(Enum::name).collect(Collectors.toSet());

        AuthResponse resp = new AuthResponse();
        resp.setToken(jwtToken);
        resp.setTokenType("Bearer");
        resp.setExpiresIn(expiresIn);
        resp.setRoles(roles);
        
        // Check if user is a tenant with temporary password
        boolean requiresPasswordChange = false;
        Tenant tenant = tenantRepository.findByPhoneNumber(user.getPhoneNumber())
                .or(() -> tenantRepository.findByEmailAddress(user.getEmail()))
                .orElse(null);
        
        if (tenant != null && tenant.getTemporaryPassword() != null && !tenant.getTemporaryPassword().isEmpty()) {
            requiresPasswordChange = true;
            // Clear the temporary password from database
            tenant.setTemporaryPassword(null);
            tenant.setPasswordChanged(true);
            tenantRepository.save(tenant);
        }
        
        resp.setRequiresPasswordChange(requiresPasswordChange);
        return resp;
    }

    public void signup(RegisterRequest registerRequest) {
                User user = userService.register(registerRequest);
                emailVerificationService.createAndSendVerification(user);
    }

    @Transactional
    public void signupWithNonFatalEmail(RegisterRequest registerRequest) {
        User user = userService.register(registerRequest);
        try {
            emailVerificationService.createAndSendVerification(user);
        } catch (Exception e) {
            // Log the error but don't fail signup - user is already created
            log.warn("Failed to send verification email for user {} ({}), but user was created. Error: {}", 
                    user.getId(), user.getEmail(), e.getMessage());
        }
    }

    public UserDetailsResponse getUserFromToken(String token) {
        String username = jwtService.extractUsername(token);
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Set<String> roles = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
        
        String fullName = user.getFirstName() + " " + user.getLastName();
        
        return new UserDetailsResponse(
                user.getId(),
                user.getUsername(),
                fullName,
                user.getEmail(),
                user.getPhoneNumber(),
                roles
        );
    }

    @Transactional
    public void changePassword(String token, String currentPassword, String newPassword) {
        String username = jwtService.extractUsername(token);
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        
        // Mark profile as not completed for first-time password change
        // This will trigger the profile completion prompt on next login
    }

    public record UserDetailsResponse(
            Long id,
            String username,
            String fullName,
            String email,
            String phoneNumber,
            Set<String> roles
    ) {}
}
