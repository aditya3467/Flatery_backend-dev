package com.Flatery.model.property;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UnitAmenityId implements Serializable {
    private Long unitId;
    private Long amenityId;
}
