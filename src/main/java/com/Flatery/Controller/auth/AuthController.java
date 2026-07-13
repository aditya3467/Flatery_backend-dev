package com.Flatery.Controller.auth;

import com.Flatery.dto.AuthResponse;
import com.Flatery.dto.LoginRequest;
import com.Flatery.dto.RegisterRequest;
import com.Flatery.dto.ResendVerificationRequest;
import com.Flatery.dto.UpdateVerificationEmailRequest;
import com.Flatery.exception.EmailDeliveryException;
import com.Flatery.exception.EmailNotVerifiedException;
import com.Flatery.service.AuthService;
import com.Flatery.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = authService.login(loginRequest);
            return ResponseEntity.ok(authResponse);
        } catch (EmailNotVerifiedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Please verify your email."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            authService.signupWithNonFatalEmail(registerRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MessageResponse("Registered successfully. Please verify your email."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(ex.getMessage()));
        }
        catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Registration failed: " + ex.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            emailVerificationService.verifyEmail(token);
            return ResponseEntity.ok(new MessageResponse("Email verified successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(ex.getMessage()));
        } catch (EmailDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        try {
            emailVerificationService.resendVerification(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("Verification email sent."));
        } catch (IllegalStateException ex) {
            HttpStatus status = "Email is already verified.".equals(ex.getMessage())
                    ? HttpStatus.CONFLICT
                    : HttpStatus.TOO_MANY_REQUESTS;
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(ex.getMessage()));
        } catch (EmailDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/update-verification-email")
    public ResponseEntity<?> updateVerificationEmail(@Valid @RequestBody UpdateVerificationEmailRequest request) {
        try {
            emailVerificationService.updateVerificationEmail(request.getCurrentEmail(), request.getNewEmail());
            return ResponseEntity.ok(new MessageResponse("Email updated and verification link sent."));
        } catch (IllegalStateException ex) {
            HttpStatus status = "Email is already verified.".equals(ex.getMessage())
                    ? HttpStatus.CONFLICT
                    : HttpStatus.TOO_MANY_REQUESTS;
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(ex.getMessage()));
        } catch (EmailDeliveryException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            // Extract token from "Bearer <token>"
            String jwtToken = token.substring(7);
            var userDetails = authService.getUserFromToken(jwtToken);
            return ResponseEntity.ok(userDetails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid or expired token"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody com.Flatery.dto.ChangePasswordRequest request) {
        try {
            String jwtToken = token.substring(7);
            authService.changePassword(jwtToken, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid or expired token"));
        }
    }

    record ErrorResponse(String error) {}
    record MessageResponse(String message) {}
}
