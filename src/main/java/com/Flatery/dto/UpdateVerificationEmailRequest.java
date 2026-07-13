package com.Flatery.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateVerificationEmailRequest {

    @NotBlank
    @Email
    private String currentEmail;

    @NotBlank
    @Email
    private String newEmail;
}
