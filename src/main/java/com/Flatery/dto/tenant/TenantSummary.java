package com.Flatery.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantSummary {
    private Long id;
    private String tenantId;
    private String tenantName;
    private String status;
    private Integer rentAmount;
    private Integer securityDeposit;
    private Integer rentDueDate;
    private Long propertyId;
    private String phoneNumber;
    private Long floorId;
    private Long unitId;
    private Integer bedIndex;
    private String leaseStartDate;
    private String emailAddress;
    private String flatRoomNumber;
    private String ownerName;
    private String ownerPhone;
    private String propertyName;
    private String propertyCity;
    private Boolean primary;
}
