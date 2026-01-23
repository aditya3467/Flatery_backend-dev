package com.Flatery.model.property;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_views",
        indexes = {
            @Index(name = "idx_view_property", columnList = "property_id"),
            @Index(name = "idx_view_user", columnList = "user_id"),
            @Index(name = "idx_view_session", columnList = "session_id"),
            @Index(name = "idx_view_timestamp", columnList = "viewed_at"),
            @Index(name = "idx_view_property_date", columnList = "property_id, viewed_at")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "user_id")
    private Long userId; // Nullable for guest views

    @Column(name = "session_id", length = 100)
    private String sessionId; // For guest tracking

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @Column(name = "view_duration_seconds")
    private Integer viewDurationSeconds; // Optional: how long they stayed

    @Column(name = "ip_hash", length = 64)
    private String ipHash; // For abuse detection (hashed IP)

    @Column(name = "referrer", length = 255)
    private String referrer; // Where they came from (listing/search/share)

    @Column(name = "is_owner_view", nullable = false)
    @Builder.Default
    private boolean ownerView = false; // Flag owner views separately
}
