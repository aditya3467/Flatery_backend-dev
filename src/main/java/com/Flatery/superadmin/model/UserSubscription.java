package com.Flatery.superadmin.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity for user subscriptions
 */
@Entity
@Table(name = "user_subscriptions",
        indexes = { @Index(name = "idx_sub_user", columnList = "user_id") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSubscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status; // ACTIVE, EXPIRED, CANCELLED, TRIAL
    
    @Column(nullable = false)
    private LocalDateTime startDate;
    
    @Column(nullable = false)
    private LocalDateTime endDate;
    
    @Column(nullable = false)
    private Boolean autoRenew;
    
    @Column(length = 100)
    private String transactionId;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (autoRenew == null) {
            autoRenew = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum SubscriptionStatus {
        ACTIVE,
        EXPIRED,
        CANCELLED,
        TRIAL
    }
}
