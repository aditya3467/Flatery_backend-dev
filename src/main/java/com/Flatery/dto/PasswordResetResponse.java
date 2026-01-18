package com.Flatery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for password reset operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetResponse {

    private boolean success;
    private String message;
    private Long otpValiditySeconds;  // Only for initial OTP send
    private String errorCode;         // For error responses

    // Factory methods for common responses
    public static PasswordResetResponse success(String message) {
        return PasswordResetResponse.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static PasswordResetResponse successWithValidity(String message, Long validitySeconds) {
        return PasswordResetResponse.builder()
                .success(true)
                .message(message)
                .otpValiditySeconds(validitySeconds)
                .build();
    }

    public static PasswordResetResponse error(String message, String errorCode) {
        return PasswordResetResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
