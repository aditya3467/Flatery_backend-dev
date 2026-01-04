package com.Flatery.superadmin.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity for subscription plans
 */
@Entity
@Table(name = "subscription_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubscriptionPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String planName; // FREE, BASIC, PREMIUM, ENTERPRISE
    
    @Column(length = 255)
    private String description;
    
    @Column(nullable = false)
    private Double priceMonthly;
    
    @Column(nullable = false)
    private Double priceYearly;
    
    // Limits
    @Column(nullable = false)
    private Integer maxProperties;
    
    @Column(nullable = false)
    private Integer maxTenants;
    
    @Column(nullable = false)
    private Integer maxImages;
    
    @Column(nullable = false)
    private Boolean allowPremiumSupport;
    
    @Column(nullable = false)
    private Boolean allowAnalytics;
    
    @Column(nullable = false)
    private Boolean allowCustomBranding;
    
    @Column(nullable = false)
    private Boolean isActive;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
