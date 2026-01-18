package com.Flatery.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.service.EmailDispatcher;
import com.Flatery.model.PasswordResetOtp;
import com.Flatery.model.User;
import com.Flatery.repository.PasswordResetOtpRepository;
import com.Flatery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final PasswordResetOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailDispatcher emailDispatcher;

    @Value("${flatery.otp.validity-minutes:10}")
    private int otpValidityMinutes;

    @Value("${flatery.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${flatery.otp.rate-limit-minutes:1}")
    private int rateLimitMinutes;

    private static final String OTP_CHARACTERS = "0123456789";
    private static final int OTP_LENGTH = 6;

    /**
     * Generate and send OTP to user's email
     */
    @Transactional
    public void generateAndSendOtp(String email) {
        // Validate email exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + email));

        // Rate limiting check
        LocalDateTime rateLimitTime = LocalDateTime.now().minusMinutes(rateLimitMinutes);
        long recentRequests = otpRepository.countRecentOtpRequestsByEmail(email, rateLimitTime);
        if (recentRequests > 0) {
            throw new IllegalStateException("OTP request rate limited. Please try again after " + rateLimitMinutes + " minute(s)");
        }

        // Generate random 6-digit OTP
        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(otpValidityMinutes);

        // Save OTP to database
        PasswordResetOtp otpEntity = PasswordResetOtp.builder()
                .user(user)
                .email(email)
                .otp(otp)
                .expiresAt(expiresAt)
                .createdAt(now)
                .isUsed(false)
                .attempts(0)
                .build();

        otpRepository.save(otpEntity);

        // Send OTP via email
        sendOtpEmail(user, email, otp);

        log.info("OTP generated and sent to email: {}", email);
    }

    /**
     * Verify OTP and reset password
     */
    @Transactional
    public void verifyOtpAndResetPassword(String email, String otp, String newPassword) {
        // Validate email exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + email));

        // Find the latest valid OTP
        Optional<PasswordResetOtp> otpRecordOpt = otpRepository.findLatestValidOtpByEmail(email);

        if (otpRecordOpt.isEmpty()) {
            throw new IllegalStateException("No valid OTP found. Please request a new OTP.");
        }

        PasswordResetOtp otpRecord = otpRecordOpt.get();

        // Check if max attempts exceeded
        if (otpRecord.hasExceededAttempts(maxAttempts)) {
            throw new IllegalStateException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        // Check if OTP is expired
        if (!otpRecord.isValid()) {
            throw new IllegalStateException("OTP has expired. Please request a new OTP.");
        }

        // Verify OTP matches
        if (!otpRecord.getOtp().equals(otp)) {
            otpRecord.setAttempts(otpRecord.getAttempts() + 1);
            otpRepository.save(otpRecord);
            throw new IllegalStateException("Invalid OTP. Please try again.");
        }

        // Mark OTP as used
        otpRecord.setIsUsed(true);
        otpRepository.save(otpRecord);

        // Reset password
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", email);
    }

    /**
     * Generate random 6-digit OTP
     */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(OTP_CHARACTERS.charAt(random.nextInt(OTP_CHARACTERS.length())));
        }
        return otp.toString();
    }

    /**
     * Send OTP via email
     */
    private void sendOtpEmail(User user, String email, String otp) {
        try {
            log.debug("Preparing to send OTP email for user: {} to email: {}", user.getId(), email);
            
            Map<String, Object> data = new HashMap<>();
            data.put("userName", user.getFirstName());
            data.put("otp", otp);
            data.put("expiryMinutes", otpValidityMinutes);

            log.debug("Email data prepared: userName={}, otpLength={}", user.getFirstName(), otp.length());
            emailDispatcher.dispatch(EmailType.OTP_RESET_PASSWORD, email, data, null);
            log.info("OTP email queued successfully for: {}", email);
        } catch (IllegalStateException e) {
            log.error("Email configuration missing or disabled for email: {}, Error: {}", email, e.getMessage());
            throw new RuntimeException("Email service not configured. Please contact administrator.", e);
        } catch (Exception e) {
            log.error("Failed to queue OTP email to {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }

    /**
     * Check if OTP is still valid for a given email
     */
    public boolean isOtpValid(String email) {
        Optional<PasswordResetOtp> otpOpt = otpRepository.findLatestValidOtpByEmail(email);
        return otpOpt.isPresent() && otpOpt.get().isValid();
    }

    /**
     * Get OTP validity time remaining (in seconds)
     */
    public long getOtpValidityRemaining(String email) {
        Optional<PasswordResetOtp> otpOpt = otpRepository.findLatestValidOtpByEmail(email);
        if (otpOpt.isEmpty()) {
            return 0;
        }

        PasswordResetOtp otp = otpOpt.get();
        long seconds = ChronoUnit.SECONDS.between(LocalDateTime.now(), otp.getExpiresAt());
        return Math.max(0, seconds);
    }
}
