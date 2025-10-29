package com.Flatery.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.Set;

@Data
public class RegisterRequest {
    @NotBlank @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank @Size(min = 2, max = 50)
    private String lastName;

    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @Email @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phoneNumber;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    // optional; if null/empty -> default USER
    private Set<String> roles;
}
