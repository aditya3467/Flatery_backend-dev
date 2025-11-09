package com.Flatery.dto;
import lombok.Data;
import java.util.Set;

@Data
public class AuthResponse {
    private String token;
    private String tokenType;
    private long expiresIn;
    private Set<String> roles;
    private boolean requiresPasswordChange;
}
