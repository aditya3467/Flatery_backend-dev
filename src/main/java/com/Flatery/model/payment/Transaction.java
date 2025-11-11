package com.Flatery.model.payment;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
@EntityListeners(AuditingEntityListener.class)
@Entity
@Table(name = "transactions",
        indexes = {
                @Index(name = "idx_transactions_tenant", columnList = "tenant_id"),
                @Index(name = "idx_transactions_owner", columnList = "owner_id"),
                @Index(name = "idx_transactions_property", columnList = "property_id"),
                @Index(name = "idx_transactions_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20, nullable = false)
    private PaymentMode paymentMode;

    @Column(name = "upi_ref", length = 100)
    private String upiRef;

    @Column(name = "screenshot_url", length = 255)
    private String screenshotUrl;

    @Column(name = "payment_month", length = 20, nullable = false)
    private String paymentMonth;  // e.g., "Nov 2025"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 50, nullable = false, updatable = false)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;


    @Column(name = "payment_date")
    private LocalDateTime paymentDate;



}
