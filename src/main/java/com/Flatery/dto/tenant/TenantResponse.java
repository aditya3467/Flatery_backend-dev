package com.Flatery.dto.tenant;

import com.Flatery.model.tenant.Tenant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {
    private Long id;
    private String tenantId;
    private String tenantName;
    private String phoneNumber;
    private String emailAddress;
    private String flatRoomNumber;
    private Long propertyId;
    private Long floorId;
    private Long unitId;
    private Integer bedIndex;
    private Integer rentAmount;
    private Integer securityDeposit;
    private Integer rentDueDate;
    private String leaseStartDate;
    private String leaseEndDate;
    private String status;

    // Credentials (not stored in tenant table) - shown once after creation
    private String username; // we will use tenantId as username
    private String temporaryPassword;

    public static TenantResponse of(Tenant t) {
        TenantResponse r = new TenantResponse();
        r.setId(t.getId());
        r.setTenantId(t.getTenantId());
        r.setTenantName(t.getTenantName());
        r.setPhoneNumber(t.getPhoneNumber());
        r.setEmailAddress(t.getEmailAddress());
        r.setFlatRoomNumber(t.getFlatRoomNumber());
        r.setPropertyId(t.getPropertyId());
        r.setFloorId(t.getFloorId());
        r.setUnitId(t.getUnitId());
        r.setBedIndex(t.getBedIndex());
        r.setRentAmount(t.getRentAmount());
        r.setSecurityDeposit(t.getSecurityDeposit());
        r.setRentDueDate(t.getRentDueDate());
        r.setLeaseStartDate(t.getLeaseStartDate() != null ? t.getLeaseStartDate().toString() : null);
        r.setLeaseEndDate(t.getLeaseEndDate() != null ? t.getLeaseEndDate().toString() : null);
        r.setStatus(t.getStatus().name());
        return r;
    }
}
