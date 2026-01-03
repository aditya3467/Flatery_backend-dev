package com.Flatery.model.property;

import com.Flatery.model.property.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Entity
@Table(
        name = "properties",
        indexes = {
                @Index(name = "idx_properties_owner", columnList = "owner_id"),
                @Index(name = "idx_properties_city", columnList = "city"),
                @Index(name = "idx_properties_type", columnList = "type"),
                @Index(name = "idx_properties_bhk", columnList = "bhk_type"),
                @Index(name = "idx_properties_rent", columnList = "expected_rent"),
                @Index(name = "idx_properties_available_from", columnList = "available_from")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Property {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ownership: admin who created the listing
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // Core
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.ACTIVE;

    @Column(length = 120)
    private String name; // required if APARTMENT/PG

    @Column(name = "flat_number", length = 20)
    private String flatNumber; // required if FLAT

    @Enumerated(EnumType.STRING)
    @Column(name = "bhk_type", length = 12)
    private BhkType bhkType; // required if FLAT/APARTMENT

    @Column(name = "pg_seater")
    private Integer pgSeater; // required if PG

    @Column(name = "current_floor", nullable = false)
    private Integer currentFloor; // 1..100

    @Column(name = "total_floor", nullable = false)
    private Integer totalFloor; // 1..100, >= current

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private PropertyAge age;

    @Enumerated(EnumType.STRING)
    @Column(length = 8)
    private Facing facing;

    @Column(name = "built_up_area_sqft", nullable = false)
    private Integer builtUpAreaSqft;

    // Locality (flattened)
    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 120)
    private String location;

    @Column(length = 200)
    private String landmark;

    // Geographic coordinates for map display
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // Rental
    @Column(name = "expected_rent", nullable = false)
    private Integer expectedRent;

    @Column(name = "expected_deposit", nullable = false)
    private Integer expectedDeposit;

    @Column(name = "rent_negotiable", nullable = false)
    private boolean negotiable;

    @Column(name = "monthly_maintenance", nullable = false)
    private Integer monthlyMaintenance;

    @Column(name = "available_from", nullable = false)
    private LocalDate availableFrom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Furnishing furnishing;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Parking parking;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Amenities and preferences
    @Column(nullable = false)
    private Integer bathrooms;

    @ElementCollection(targetClass = Amenity.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "property_amenities", joinColumns = @JoinColumn(name = "property_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "amenity", length = 32, nullable = false)
    private Set<Amenity> amenities;

    @Column(nullable = false)
    private boolean balcony;

    @ElementCollection(targetClass = PreferredTenant.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "property_preferred_tenants", joinColumns = @JoinColumn(name = "property_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "tenant_type", length = 24, nullable = false)
    private Set<PreferredTenant> preferredTenants;

    // Showing / condition
    @Enumerated(EnumType.STRING)
    @Column(name = "who_shows", length = 16)
    private WhoShows whoShows;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_condition", length = 24)
    private CurrentCondition currentCondition;

    // Schedule
    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_availability", length = 12)
    private Availability scheduleAvailability;

    @Column(name = "schedule_start")
    private LocalTime scheduleStart;

    @Column(name = "schedule_end")
    private LocalTime scheduleEnd;

    @Column(name = "all_day", nullable = false)
    private boolean allDay;

    // Metadata
    @CreationTimestamp
    @Column(name = "posted_on", nullable = false)
    private LocalDate postedOn;
}
