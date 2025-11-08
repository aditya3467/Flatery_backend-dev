package com.Flatery.dto;
import lombok.Data;
import java.util.Set;

@Data
public class AuthResponse {
    private String token;
    private String tokenType;
    private long expiresIn;
    private Set<String> roles;
<<<<<<< HEAD
    private boolean requiresPasswordChange;
=======
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
}
