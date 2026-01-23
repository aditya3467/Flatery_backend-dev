package com.Flatery.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity to store OTP for password reset functionality
 */
@Entity
@Table(
        name = "password_reset_otp",
        indexes = {
                @Index(name = "idx_email", columnList = "email"),
                @Index(name = "idx_otp", columnList = "otp"),
                @Index(name = "idx_expires_at", columnList = "expires_at"),
                @Index(name = "idx_user_id", columnList = "user_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Check if OTP is still valid
     */
    public boolean isValid() {
        return !isUsed && LocalDateTime.now().isBefore(expiresAt);
    }

    /**
     * Check if OTP has exceeded max attempts
     */
    public boolean hasExceededAttempts(int maxAttempts) {
        return attempts >= maxAttempts;
    }

    /**
     * Check if OTP can still accept attempts
     */
    public boolean canAttempt(int maxAttempts) {
        return isValid() && !hasExceededAttempts(maxAttempts);
    }
}
