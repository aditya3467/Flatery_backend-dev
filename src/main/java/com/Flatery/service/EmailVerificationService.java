package com.Flatery.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.service.EmailDispatcher;
import com.Flatery.model.EmailVerificationToken;
import com.Flatery.model.User;
import com.Flatery.repository.EmailVerificationTokenRepository;
import com.Flatery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailDispatcher emailDispatcher;

    @Value("${flatery.email-verification.base-url:https://flatery.in}")
    private String verificationBaseUrl;

    @Value("${flatery.email-verification.token-valid-hours:24}")
    private int tokenValidHours;

    @Value("${flatery.email-verification.resend-rate-limit-minutes:1}")
    private int resendRateLimitMinutes;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public void createAndSendVerification(User user) {
        createAndSendVerificationInternal(user, false);
    }

    @Transactional
    public void resendVerification(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + normalizedEmail));

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

        createAndSendVerificationInternal(user, true);
    }

    @Transactional
    public void updateVerificationEmail(String currentEmail, String newEmail) {
        String normalizedCurrentEmail = currentEmail.trim().toLowerCase();
        String normalizedNewEmail = newEmail.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedCurrentEmail)
                .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + normalizedCurrentEmail));

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new IllegalStateException("Email is already verified.");
        }


        if (!normalizedCurrentEmail.equals(normalizedNewEmail)) {
            var existingOpt = userRepository.findByEmail(normalizedNewEmail);
            if (existingOpt.isPresent() && !existingOpt.get().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Email already exists");
            }
        }

        if (normalizedCurrentEmail.equals(normalizedNewEmail)) {
            resendVerification(normalizedCurrentEmail);
            return;
        }

        user.setEmail(normalizedNewEmail);
        user.setVerified(false);
        user.setEmailVerifiedAt(null);
        userRepository.save(user);

        tokenRepository.deleteByUser_Id(user.getId());
        createAndSendVerificationInternal(user, true);
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

    private void createAndSendVerificationInternal(User user, boolean resend) {
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

        tokenRepository.save(Objects.requireNonNull(token));
        sendVerificationEmail(user, rawToken, resend);
    }

    private void sendVerificationEmail(User user, String rawToken, boolean resend) {
        String verifyLink = verificationBaseUrl + "/verify-email?token=" + rawToken;

        Map<String, Object> data = new HashMap<>();
        data.put("user_name", user.getFirstName());
        data.put("verification_link", verifyLink);
        data.put("expiry_hours", tokenValidHours);

        emailDispatcher.dispatch(EmailType.EMAIL_VERIFICATION, user.getEmail(), data, null);
        log.info("Queued {} email verification message for userId={}", resend ? "resend" : "new", user.getId());
    }

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
