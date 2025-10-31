package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Data
public class UpdatePropertyRequest {

    private PropertyType type;
    private String name;
    private BhkType bhkType;
    private Integer pgSeater;

    private Integer currentFloor;
    private Integer totalFloor;
    private PropertyAge age;
    private Facing facing;
    private Integer builtUpAreaSqft;

    private LocalityDto locality;
    private RentalDto rental;

    private Integer bathrooms;
    private Set<Amenity> amenities;
    private Boolean balcony;

    private ShowingDto showing;

    private Availability availability;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean allDay;
}
