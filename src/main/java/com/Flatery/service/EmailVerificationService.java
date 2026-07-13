package com.Flatery.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailLog;
import com.Flatery.email.entity.EmailQueue;
import com.Flatery.email.repository.EmailLogRepository;
import com.Flatery.email.repository.EmailQueueRepository;
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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailQueueRepository emailQueueRepository;
    private final EmailLogRepository emailLogRepository;
    private final PlatformTransactionManager transactionManager;

    @Value("${flatery.email-verification.base-url:https://flatery.in}")
    private String verificationBaseUrl;

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

        try {
            EmailQueue email = EmailQueue.builder()
                    .recipient(message.email())
                    .subject("Verify your Flatery account")
                    .bodyHtml(buildVerificationHtml(message.firstName(), verifyLink))
                    .bodyText(buildVerificationText(message.firstName(), verifyLink))
                    .emailType(EmailType.EMAIL_VERIFICATION)
                    .status(EmailQueue.Status.PENDING)
                    .attempts(0)
                    .scheduledAt(Instant.now())
                    .build();

            emailQueueRepository.save(email);

            emailLogRepository.save(EmailLog.builder()
                    .emailId(email.getId())
                    .recipient(message.email())
                    .emailType(EmailType.EMAIL_VERIFICATION)
                    .status("PENDING")
                    .build());

            log.info("Queued {} email verification message for userId={}",
                    message.resend() ? "resend" : "new", message.userId());
        } catch (Exception e) {
            log.error("Failed to queue verification email for userId={} email={}: {}",
                    message.userId(), message.email(), e.getMessage(), e);
            throw new EmailDeliveryException("Unable to queue verification email: " + rootMessage(e), e);
        }
    }

    private String buildVerificationHtml(String firstName, String verifyLink) {
        String escapedName = escapeHtml(firstName == null || firstName.isBlank() ? "there" : firstName);
        String escapedLink = escapeHtml(verifyLink);

        return "<html><body style=\"font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;\">"
                + "<h2 style=\"color:#333;\">Welcome to Flatery, " + escapedName + "!</h2>"
                + "<p style=\"color:#666;line-height:1.6;\">Please verify your email address to activate your account.</p>"
                + "<p style=\"margin:24px 0;\"><a href=\"" + escapedLink + "\" style=\"background:#007bff;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;\">Verify Email</a></p>"
                + "<p style=\"color:#666;line-height:1.6;\">This link is valid for " + tokenValidHours + " hours.</p>"
                + "<p style=\"color:#999;font-size:12px;\">If you did not create this account, you can ignore this email.</p>"
                + "</div></body></html>";
    }

    private String buildVerificationText(String firstName, String verifyLink) {
        String name = firstName == null || firstName.isBlank() ? "there" : firstName;

        return "Welcome to Flatery, " + name + "!\n\n"
                + "Please verify your email address using this link:\n"
                + verifyLink + "\n\n"
                + "This link is valid for " + tokenValidHours + " hours.";
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String rootMessage(Exception e) {
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage() == null ? e.getClass().getSimpleName() : root.getMessage();
    }

    private String buildVerificationLink(String rawToken) {
        String baseUrl = verificationBaseUrl == null ? "" : verificationBaseUrl.trim();
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        String encodedToken = URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        return baseUrl + "/api/auth/verify-link?token=" + encodedToken;
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
