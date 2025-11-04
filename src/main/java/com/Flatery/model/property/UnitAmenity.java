package com.Flatery.model.property;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "unit_amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UnitAmenityId.class)
public class UnitAmenity {

    @Id
    @Column(name = "unit_id")
    private Long unitId;

    @Id
    @Column(name = "amenity_id")
    private Long amenityId;

    @Column(name = "value", length = 100)
    private String value;

    @Column(name = "included")
    private Boolean included;
}
