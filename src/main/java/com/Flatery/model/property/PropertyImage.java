package com.Flatery.model.property;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_images",
        indexes = { @Index(name = "idx_propimg_property", columnList = "property_id"),
                @Index(name = "idx_propimg_position", columnList = "position") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyImage {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 160)
    private String caption;

    @Column(nullable = false)
    private Integer position; // for ordering

    @Column(name = "is_primary", nullable = false)
    private boolean primaryImage;
}
