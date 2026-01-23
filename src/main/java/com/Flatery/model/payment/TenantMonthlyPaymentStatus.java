package com.Flatery.model.payment;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_monthly_payment_status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantMonthlyPaymentStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    
    @Column(name = "payment_month", nullable = false, length = 10)
    private String paymentMonth; // Format: "YYYY-MM"
    
    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private boolean isPaid = false;
    
    @Column(name = "marked_paid_date")
    private LocalDateTime markedPaidDate;
    
    @Column(name = "marked_by")
    private String markedBy;
    
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}