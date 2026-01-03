package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PropertySummary {
    private Long id;
    private PropertyType type;
    private PropertyStatus status;
    private String name;
    private String flatNumber;
    private BhkType bhkType;
    private String city;
    private String location;
    private Integer builtUpAreaSqft;
    private Double latitude;
    private Double longitude;
    private Integer expectedRent;
    private Furnishing furnishing;
    private Parking parking;
    private LocalDate availableFrom;
    private String primaryImageUrl;
    private LocalDate postedOn;
    // Owner details for display
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
}
