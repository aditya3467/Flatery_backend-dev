package com.Flatery.service;

import com.Flatery.dto.RegisterRequest;
import com.Flatery.dto.AuthResponse;
import com.Flatery.dto.LoginRequest;
import com.Flatery.exception.EmailNotVerifiedException;
import com.Flatery.model.User;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.model.RoleName;
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
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Map;

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

        Set<String> roles = user.getRoles().stream().map(r -> r.name()).collect(Collectors.toSet());

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

    public AuthResponse googleLogin(String idToken) throws Exception {
        // Validate token with Google tokeninfo endpoint
        URL url = new URL("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);

        int code = conn.getResponseCode();
        if (code != 200) {
            throw new IllegalArgumentException("Invalid Google ID token");
        }

        InputStream is = conn.getInputStream();
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> payload = mapper.readValue(is, new TypeReference<Map<String, Object>>() {});

        String email = (String) payload.get("email");
        String givenName = (String) payload.getOrDefault("given_name", "");
        String familyName = (String) payload.getOrDefault("family_name", "");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google token did not contain an email");
        }

        // Check if user exists by email
        User user = userRepo.findByEmail(email).orElse(null);

        if (user == null) {
            // Create a username from email local-part
            String username = email.split("@")[0];
            if (username.length() < 3) {
                username += "user";
            }
            // Ensure username uniqueness by appending random suffix if needed
            String baseUsername = username;
            int suffix = 0;
            while (userRepo.existsByUsername(username)) {
                suffix++;
                username = baseUsername + suffix;
            }

            String firstName = (givenName == null || givenName.isBlank()) ? username : givenName;
            String lastName = (familyName == null || familyName.isBlank()) ? "Google" : familyName;

            RegisterRequest req = new RegisterRequest();
            req.setFirstName(firstName);
            req.setLastName(lastName);
            req.setUsername(username);
            req.setEmail(email);
            // Generate a random password for the account (owner can set/change later)
            req.setPassword(java.util.UUID.randomUUID().toString());

            user = userService.register(req);
            // Mark email verified since it came from Google
            user.setVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            userRepo.save(user);
        }

        // Build JWT and response (reuse login-like flow)
        org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.User)
                userService.loadUserByUsername(user.getUsername());

        String jwtToken = jwtService.generateToken(userDetails);
        long expiresIn = jwtService.getExpirationTime();

        java.util.Set<String> roles = user.getRoles().stream().map(r -> r.name()).collect(java.util.stream.Collectors.toSet());

        AuthResponse resp = new AuthResponse();
        resp.setToken(jwtToken);
        resp.setTokenType("Bearer");
        resp.setExpiresIn(expiresIn);
        resp.setRoles(roles);

        // Determine if profile completion is needed (e.g., missing phone)
        boolean needsProfile = (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank())
                || (user.getFirstName() == null || user.getFirstName().isBlank())
                || (user.getLastName() == null || user.getLastName().isBlank());

        resp.setRequiresPasswordChange(false);
        resp.setRequiresProfileCompletion(needsProfile);

        return resp;
    }

    public void signup(RegisterRequest registerRequest) {
                User user = userService.register(registerRequest);
                emailVerificationService.createAndSendVerification(user);
    }

    public void updateProfile(String token, com.Flatery.dto.UpdateProfileRequest req) {
        String username = jwtService.extractUsername(token);
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            String requestedUsername = req.getUsername().trim().toLowerCase();
            if (!requestedUsername.equals(user.getUsername())) {
                if (userRepo.existsByUsername(requestedUsername)) {
                    throw new IllegalArgumentException("Username is already taken");
                }
                user.setUsername(requestedUsername);
            }
        }

        if (req.getFirstName() != null && !req.getFirstName().isBlank()) {
            user.setFirstName(req.getFirstName().trim());
        }
        if (req.getLastName() != null && !req.getLastName().isBlank()) {
            user.setLastName(req.getLastName().trim());
        }
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getRole() != null && !req.getRole().isBlank()) {
            String roleName = req.getRole().trim().toUpperCase();
            if (!roleName.equals("USER") && !roleName.equals("ADMIN")) {
                throw new IllegalArgumentException("Invalid role selected");
            }
            RoleName role = RoleName.valueOf(roleName);
            user.setRoles(Set.of(role));
        }

        userRepo.save(user);
    }

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
                .map(r -> r.name())
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
