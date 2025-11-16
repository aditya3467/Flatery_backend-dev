package com.Flatery.model.tenant;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenancy",
        indexes = {
                @Index(name = "idx_tenant_owner", columnList = "owner_id"),
                @Index(name = "idx_tenant_property", columnList = "property_id"),
                @Index(name = "idx_tenant_tenantId", columnList = "tenant_id", unique = true)
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Human friendly external ID like TEN12345
    @Column(name = "tenant_id", nullable = false, unique = true, length = 20)
    private String tenantId;

    // Owner who created the tenant
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // Property linked to this tenant
    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "tenant_name", nullable = false, length = 100)
    private String tenantName;

    // Contact and login preferences
    @Column(name = "phone_number", length = 20, nullable = false)
    private String phoneNumber;

    @Column(name = "email_address", length = 120)
    private String emailAddress; // optional

    // Specific unit identifier
    @Column(name = "flat_room_number", length = 40)
    private String flatRoomNumber;

    @Column(name = "rent_amount", nullable = false)
    private Integer rentAmount;

    @Column(name = "security_deposit", nullable = false)
    private Integer securityDeposit;

    // Day of the month rent is due (1..31)
    @Column(name = "rent_due_date")
    private Integer rentDueDate;

    // Lease dates
    @Column(name = "lease_start_date")
    private LocalDate leaseStartDate;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    // Temporary password shown to owner on creation (stored as provided/generated)
    @Column(name = "temporary_password", length = 120)
    private String temporaryPassword;

    @Column(name = "password_changed", nullable = false)
    private boolean passwordChanged;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private TenantStatus status;

    // Unit assignment (PG/shared housing)
    @Column(name = "floor_id")
    private Long floorId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "bed_index")
    private Integer bedIndex;

    // Primary tenant indicator (1 = primary, 0 = secondary)
    @Column(name = "`primary`", nullable = false)
    private boolean primary = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum TenantStatus {
        ACTIVE,
        PENDING_INFO,
        VACATED
    }
}

