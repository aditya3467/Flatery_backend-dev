package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PropertySummary {
    private Long id;
    private PropertyType type;
    private BhkType bhkType;
    private String city;
    private String location;
    private Integer builtUpAreaSqft;
    private Integer expectedRent;
    private Furnishing furnishing;
    private Parking parking;
    private LocalDate availableFrom;
    private String primaryImageUrl;
    private LocalDate postedOn;
}
