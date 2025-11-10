package com.Flatery.model.property;

import com.Flatery.model.property.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "units",
        uniqueConstraints = @UniqueConstraint(name = "uq_floor_code", columnNames = {"floor_id", "code"}),
        indexes = {
                @Index(name = "ix_units_property", columnList = "property_id"),
                @Index(name = "ix_units_floor", columnList = "floor_id"),
                @Index(name = "ix_units_status", columnList = "status"),
                @Index(name = "ix_units_parent", columnList = "parent_unit_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "floor_id", nullable = false)
    private Long floorId;

    @Column(name = "parent_unit_id")
    private Long parentUnitId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 16)
    private UnitType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "sharing_type", length = 16)
    private SharingType sharingType;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_policy", length = 8)
    private GenderPolicy genderPolicy;

    @Column(name = "rent_amount")
    private Double rentAmount;

    @Column(name = "deposit_amount")
    private Double depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 16)
    private UnitStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "furnished_level", length = 20)
    private Furnishing furnishedLevel;

        @Column(name = "attributes", columnDefinition = "TEXT")
        private String attributes; // JSON string stored as TEXT for MySQL 5.5 compatibility

    // Note: We do NOT persist occupancy; it's computed from tenancy on demand.

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
