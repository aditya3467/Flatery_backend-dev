package com.Flatery.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class UpdateProfileRequest {
    @Size(min = 3, max = 50)
    private String username;

    @Size(min = 1, max = 50)
    private String firstName;

    @Size(min = 1, max = 50)
    private String lastName;

    @Size(max = 20)
    private String phoneNumber;

    @Size(max = 20)
    private String role;
}
