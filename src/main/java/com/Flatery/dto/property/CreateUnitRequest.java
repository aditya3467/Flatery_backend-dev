package com.Flatery.dto.property;

import com.Flatery.model.property.enums.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUnitRequest {
    private Long floorId;
    private String code;
    private UnitType type;
    private SharingType sharingType;
    private Integer capacity;
    private GenderPolicy genderPolicy;
    private Double rentAmount;
    private Double depositAmount;
    private Furnishing furnishedLevel;
    private String attributes; // JSON string
}
