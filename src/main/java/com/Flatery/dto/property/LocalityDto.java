package com.Flatery.dto.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LocalityDto {
    @NotBlank @Size(max = 80)
    private String city;

    @NotBlank @Size(max = 120)
    private String location;

    @Size(max = 200)
    private String landmark;
}
