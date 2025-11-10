package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitResponse {
    private Long id;
    private Long propertyId;
    private Long floorId;
    private String code;
    private UnitType type;
    private SharingType sharingType;
    private Integer capacity;
    private Integer occupiedBeds; // cached occupancy for quick UI
    private GenderPolicy genderPolicy;
    private Double rentAmount;
    private Double depositAmount;
    private UnitStatus status;
    private Furnishing furnishedLevel;
    private String attributes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
