package com.Flatery.model.tenant;

import com.Flatery.model.property.Floor;
import com.Flatery.model.property.Property;
import com.Flatery.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenancy_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenancyHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tenant Information (copied from original tenant record)
    @Column(name = "tenant_name", nullable = false, length = 100)
    private String tenantName;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "email_address", length = 120)
    private String emailAddress;

    // Property and Ownership Details
    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // Specific unit identifier
    @Column(name = "flat_room_number", length = 40)
    private String flatRoomNumber;

    // Tenancy Details
    // Unit assignment (for PG/shared housing)
    @Column(name = "floor_id")
    private Long floorId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "bed_index")
    private Integer bedIndex;

    // Financial Information
    @Column(name = "rent_amount", nullable = false)
    private Integer rentAmount;

    @Column(name = "security_deposit", nullable = false)
    private Integer securityDeposit;

    // Day of the month rent is due (1..31)
    @Column(name = "rent_due_date")
    private Integer rentDueDate;

    // Tenancy Period
    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    // Status and Reason
    @Column(name = "vacate_reason", length = 500)
    private String vacateReason;

    // Timestamps
    @Column(name = "tenancy_start_date", nullable = false)
    private LocalDateTime tenancyStartDate;

    @Column(name = "tenancy_end_date", nullable = false)
    private LocalDateTime tenancyEndDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Create TenancyHistory from existing Tenant record
     */
    public static TenancyHistory fromTenant(Tenant tenant, String vacateReason) {
        return TenancyHistory.builder()
                .tenantName(tenant.getTenantName())
                .phoneNumber(tenant.getPhoneNumber())
                .emailAddress(tenant.getEmailAddress())
                .propertyId(tenant.getPropertyId())
                .ownerId(tenant.getOwnerId())
                .floorId(tenant.getFloorId())
                .unitId(tenant.getUnitId())
                .bedIndex(tenant.getBedIndex())
                .flatRoomNumber(tenant.getFlatRoomNumber())
                .rentAmount(tenant.getRentAmount())
                .securityDeposit(tenant.getSecurityDeposit())
                .rentDueDate(tenant.getRentDueDate())
                .moveInDate(tenant.getLeaseStartDate())
                .moveOutDate(LocalDate.now())
                .leaseEndDate(tenant.getLeaseEndDate())
                .vacateReason(vacateReason)
                .tenancyStartDate(tenant.getCreatedAt())
                .tenancyEndDate(LocalDateTime.now())
                .build();
    }
}