package com.Flatery.Controller.auth;

import com.Flatery.dto.ForgotPasswordRequest;
import com.Flatery.dto.PasswordResetResponse;
import com.Flatery.dto.ResetPasswordRequest;
import com.Flatery.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<PasswordResetResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        try {
            log.info("Forgot password request for email: {}", request.getEmail());

            passwordResetService.generateAndSendOtp(request.getEmail());
            long otpValiditySeconds = passwordResetService.getOtpValidityRemaining(request.getEmail());

            PasswordResetResponse response = PasswordResetResponse.successWithValidity(
                    "OTP sent to your registered email. It is valid for 10 minutes.",
                    otpValiditySeconds
            );
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            log.warn("Rate limit or other error for email: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(PasswordResetResponse.error(e.getMessage(), "RATE_LIMIT_EXCEEDED"));

        } catch (IllegalArgumentException e) {
            log.warn("Email not found: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(PasswordResetResponse.error(
                            "Email address not found in our system. Please check and try again.",
                            "EMAIL_NOT_FOUND"
                    ));

        } catch (RuntimeException e) {
            log.error("Error sending OTP for email: {}, Error: {}", request.getEmail(), e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("Email service not configured")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(PasswordResetResponse.error(
                                "Email service is not configured. Please contact administrator.",
                                "EMAIL_SERVICE_NOT_CONFIGURED"
                        ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "Failed to send OTP. " + (e.getMessage() != null ? e.getMessage() : "Please try again later."),
                            "SEND_OTP_FAILED"
                    ));
        } catch (Exception e) {
            log.error("Unexpected error sending OTP for email: {}, Error: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "An unexpected error occurred. Please try again later.",
                            "INTERNAL_ERROR"
                    ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<PasswordResetResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        try {
            log.info("Password reset request for email: {}", request.getEmail());

            if (!request.isPasswordMatch()) {
                return ResponseEntity.badRequest()
                        .body(PasswordResetResponse.error(
                                "Passwords do not match",
                                "PASSWORD_MISMATCH"
                        ));
            }

            passwordResetService.verifyOtpAndResetPassword(
                    request.getEmail(),
                    request.getOtp(),
                    request.getNewPassword()
            );

            PasswordResetResponse response = PasswordResetResponse.success(
                    "Password reset successful. You can now login with your new password."
            );
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            log.warn("OTP verification failed for email: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(PasswordResetResponse.error(e.getMessage(), "OTP_VERIFICATION_FAILED"));

        } catch (Exception e) {
            log.error("Error resetting password for email: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "Failed to reset password. Please try again.",
                            "RESET_PASSWORD_FAILED"
                    ));
        }
    }

    @GetMapping("/otp-validity")
    public ResponseEntity<PasswordResetResponse> checkOtpValidity(
            @RequestParam String email) {
        try {
            boolean isValid = passwordResetService.isOtpValid(email);
            long remainingSeconds = passwordResetService.getOtpValidityRemaining(email);

            if (isValid) {
                return ResponseEntity.ok(PasswordResetResponse.builder()
                        .success(true)
                        .message("OTP is still valid")
                        .otpValiditySeconds(remainingSeconds)
                        .build());
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(PasswordResetResponse.error(
                                "OTP has expired or is invalid. Please request a new OTP.",
                                "OTP_INVALID_OR_EXPIRED"
                        ));
            }
        } catch (Exception e) {
            log.error("Error checking OTP validity for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "Failed to check OTP validity",
                            "CHECK_VALIDITY_FAILED"
                    ));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<PasswordResetResponse> resendOtp(
            @Valid @RequestBody ForgotPasswordRequest request) {
        try {
            log.info("Resend OTP request for email: {}", request.getEmail());

            passwordResetService.generateAndSendOtp(request.getEmail());
            long otpValiditySeconds = passwordResetService.getOtpValidityRemaining(request.getEmail());

            PasswordResetResponse response = PasswordResetResponse.successWithValidity(
                    "New OTP has been sent to your email. It is valid for 10 minutes.",
                    otpValiditySeconds
            );
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            log.warn("Rate limit or other error for resend OTP email: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(PasswordResetResponse.error(e.getMessage(), "RATE_LIMIT_EXCEEDED"));

        } catch (IllegalArgumentException e) {
            log.warn("Email not found: {}, Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(PasswordResetResponse.error(
                            "Email address not found in our system. Please check and try again.",
                            "EMAIL_NOT_FOUND"
                    ));

        } catch (RuntimeException e) {
            log.error("Error resending OTP for email: {}, Error: {}", request.getEmail(), e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("Email service not configured")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(PasswordResetResponse.error(
                                "Email service is not configured. Please contact administrator.",
                                "EMAIL_SERVICE_NOT_CONFIGURED"
                        ));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "Failed to send OTP. " + (e.getMessage() != null ? e.getMessage() : "Please try again later."),
                            "SEND_OTP_FAILED"
                    ));
        } catch (Exception e) {
            log.error("Unexpected error resending OTP for email: {}, Error: {}", request.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PasswordResetResponse.error(
                            "An unexpected error occurred. Please try again later.",
                            "INTERNAL_ERROR"
                    ));
        }
        }
}
