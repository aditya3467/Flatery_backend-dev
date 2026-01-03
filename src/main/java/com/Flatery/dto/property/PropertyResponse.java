package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Data
public class PropertyResponse {
    private Long id;

    private PropertyType type;
    private PropertyStatus status;
    private String name;
    private String flatNumber;
    private BhkType bhkType;
    private Integer pgSeater;

    private Integer currentFloor;
    private Integer totalFloor;
    private PropertyAge age;
    private Facing facing;
    private Integer builtUpAreaSqft;

    private String city;
    private String location;
    private String landmark;
    private Double latitude;
    private Double longitude;

    private Integer expectedRent;
    private Integer expectedDeposit;
    private boolean negotiable;
    private Integer monthlyMaintenance;
    private LocalDate availableFrom;

    private Set<PreferredTenant> preferredTenants;
    private Furnishing furnishing;
    private Parking parking;
    private String description;

    private Integer bathrooms;
    private Set<Amenity> amenities;
    private boolean balcony;

    private WhoShows whoShows;
    private CurrentCondition currentCondition;

    private Availability availability;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean allDay;

    private String primaryImageUrl; // to be set from images module
    private LocalDate postedOn;
    // Owner details for display
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
}
