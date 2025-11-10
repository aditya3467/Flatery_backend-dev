package com.Flatery.model.property;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "floors",
        uniqueConstraints = @UniqueConstraint(name = "uq_property_floor", columnNames = {"property_id", "number"}),
        indexes = {
                @Index(name = "ix_floors_property", columnList = "property_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "number", nullable = false)
    private Integer number; // 0 = Ground, 1 = First...

    @Column(name = "name", length = 50)
    private String name;

    @Column(name = "sort_index")
    private Integer sortIndex;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
