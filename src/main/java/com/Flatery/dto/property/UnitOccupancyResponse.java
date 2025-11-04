package com.Flatery.dto.property;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnitOccupancyResponse {
    private Long unitId;
    private Integer capacity;
    private long activeCount;
    private long totalTenants;
    private List<TenantBedInfo> tenants;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantBedInfo {
        private Long id;
        private String tenantId;
        private String name;
        private Integer bedIndex;
        private String leaseStartDate;
        private String leaseEndDate;
        private boolean active;
    }
}
