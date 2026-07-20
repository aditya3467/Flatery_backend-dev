package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Data
public class CreatePropertyRequest {

    @NotNull
    private PropertyType type; // PG, FLAT, APARTMENT

    // Required if type = APARTMENT or PG
    @Size(min = 2, max = 120)
    private String name;

    // Required if type = FLAT
    @Size(min = 1, max = 20)
    private String flatNumber;

    // Required if type = FLAT/APARTMENT; must be null for PG
    private BhkType bhkType;

    // Required if type = PG; must be null for FLAT/APARTMENT
    @Min(1) @Max(6)
    private Integer pgSeater;

    @NotNull @Min(1) @Max(100)
    private Integer currentFloor;

    @NotNull @Min(1) @Max(100)
    private Integer totalFloor;

    @NotNull
    private PropertyAge age;

    private Facing facing;

    @NotNull @Min(1)
    private Integer builtUpAreaSqft;

    @NotNull
    private LocalityDto locality;

    @NotNull
    private RentalDto rental;

    @NotNull @Min(0) @Max(10)
    private Integer bathrooms;

    @NotNull
    private Set<Amenity> amenities;

    @NotNull
    private Boolean balcony;

    private ShowingDto showing;

    private ScheduleDto schedule;

    // Geographic coordinates from map (will be merged into locality)
    private Double latitude;
    
    private Double longitude;}