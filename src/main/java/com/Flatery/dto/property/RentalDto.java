package com.Flatery.dto.property;

import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.Parking;
import com.Flatery.model.property.enums.PreferredTenant;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class RentalDto {
    @NotNull @Min(1)
    private Integer expectedRent;

    @NotNull @Min(0)
    private Integer expectedDeposit;

    @NotNull
    private Boolean negotiable;

    @NotNull @Min(0)
    private Integer monthlyMaintenance;

    @NotNull
    private LocalDate availableFrom;

    @NotNull
    private Set<PreferredTenant> preferredTenants;

    @NotNull
    private Furnishing furnishing;

    @NotNull
    private Parking parking;

    @Size(max = 1200)
    private String description;
}
