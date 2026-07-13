package com.Flatery.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.service.EmailDispatcher;
import com.Flatery.exception.EmailDeliveryException;
import com.Flatery.model.EmailVerificationToken;
import com.Flatery.model.User;
import com.Flatery.repository.EmailVerificationTokenRepository;
import com.Flatery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.function.Supplier;
import java.net.URLEncoder;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailDispatcher emailDispatcher;
    private final PlatformTransactionManager transactionManager;

    @Value("${flatery.email-verification.base-url:https://flatery.in}")
    private String verificationBaseUrl;

    @Value("${flatery.frontend.base-path:}")
    private String frontendBasePath;

    @Value("${flatery.email-verification.token-valid-hours:24}")
    private int tokenValidHours;

    @Value("${flatery.email-verification.resend-rate-limit-minutes:1}")
    private int resendRateLimitMinutes;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public void createAndSendVerification(User user) {
        VerificationEmailMessage message = runInTransaction(() -> {
            User managedUser = userRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("User with id not found: " + user.getId()));
            return createVerificationMessage(managedUser, false);
        });
        sendVerificationEmail(message);
    }

    public void resendVerification(String email) {
        VerificationEmailMessage message = runInTransaction(() -> {
            String normalizedEmail = email.trim().toLowerCase();
            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + normalizedEmail));

            validateCanSendVerification(user);

            return createVerificationMessage(user, true);
        });
        sendVerificationEmail(message);
    }

    public void updateVerificationEmail(String currentEmail, String newEmail) {
        VerificationEmailMessage message = runInTransaction(() -> {
            String normalizedCurrentEmail = currentEmail.trim().toLowerCase();
            String normalizedNewEmail = newEmail.trim().toLowerCase();

            User user = userRepository.findByEmail(normalizedCurrentEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + normalizedCurrentEmail));

            if (Boolean.TRUE.equals(user.getVerified())) {
                throw new IllegalStateException("Email is already verified.");
            }

            if (normalizedCurrentEmail.equals(normalizedNewEmail)) {
                validateCanSendVerification(user);
            } else {
                var existingOpt = userRepository.findByEmail(normalizedNewEmail);
                if (existingOpt.isPresent() && !existingOpt.get().getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Email already exists");
                }

                user.setEmail(normalizedNewEmail);
                user.setVerified(false);
                user.setEmailVerifiedAt(null);
                userRepository.save(user);
            }

            return createVerificationMessage(user, true);
        });
        sendVerificationEmail(message);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired verification link.");
        }

        String tokenHash = hashToken(rawToken);
        EmailVerificationToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification link."));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(token);
            throw new IllegalArgumentException("Invalid or expired verification link.");
        }

        User user = token.getUser();
        if (!Boolean.TRUE.equals(user.getVerified())) {
            user.setVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        tokenRepository.deleteByUser_Id(user.getId());
    }

    private VerificationEmailMessage createVerificationMessage(User user, boolean resend) {
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        tokenRepository.deleteByUser_Id(user.getId());

        LocalDateTime now = LocalDateTime.now();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .createdAt(now)
                .expiresAt(now.plusHours(tokenValidHours))
                .build();

        tokenRepository.save(token);

        return new VerificationEmailMessage(
                user.getId(),
                user.getFirstName(),
                user.getEmail(),
                rawToken,
                resend
        );
    }

    private void validateCanSendVerification(User user) {
        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new IllegalStateException("Email is already verified.");
        }

        var latestTokenOpt = tokenRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId());
        if (latestTokenOpt.isPresent()) {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(resendRateLimitMinutes);
            if (latestTokenOpt.get().getCreatedAt().isAfter(threshold)) {
                throw new IllegalStateException("Please wait 1 minute before requesting another verification email.");
            }
        }
    }

    private void sendVerificationEmail(VerificationEmailMessage message) {
        String verifyLink = buildVerificationLink(message.rawToken());

        Map<String, Object> data = new HashMap<>();
        data.put("user_name", message.firstName());
        data.put("verification_link", verifyLink);
        data.put("expiry_hours", tokenValidHours);

        try {
            emailDispatcher.dispatch(EmailType.EMAIL_VERIFICATION, message.email(), data, null);
            log.info("Queued {} email verification message for userId={}",
                    message.resend() ? "resend" : "new", message.userId());
        } catch (Exception e) {
            log.warn("Failed to queue verification email for userId={} email={}: {}",
                    message.userId(), message.email(), e.getMessage());
            throw new EmailDeliveryException("Unable to send verification email right now. Please try again later.", e);
        }
    }

    private String buildVerificationLink(String rawToken) {
        String baseUrl = verificationBaseUrl == null ? "" : verificationBaseUrl.trim();
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        String basePath = frontendBasePath == null ? "" : frontendBasePath.trim();
        if ("/".equals(basePath)) {
            basePath = "";
        }
        if (!basePath.isEmpty() && !basePath.startsWith("/")) {
            basePath = "/" + basePath;
        }
        while (basePath.endsWith("/")) {
            basePath = basePath.substring(0, basePath.length() - 1);
        }

        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        return baseUrl + basePath + "/verify-email.html?token=" + encodedToken;
    }

    private <T> T runInTransaction(Supplier<T> action) {
        return new TransactionTemplate(transactionManager).execute(status -> action.get());
    }

    private record VerificationEmailMessage(
            Long userId,
            String firstName,
            String email,
            String rawToken,
            boolean resend
    ) {}

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }
    }
}
