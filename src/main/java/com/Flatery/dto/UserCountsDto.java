package com.Flatery.dto;

public class UserCountsDto {
    private long ownerCount;
    private long tenantCount;

    public UserCountsDto() {}

    public UserCountsDto(long ownerCount, long tenantCount) {
        this.ownerCount = ownerCount;
        this.tenantCount = tenantCount;
    }

    public long getOwnerCount() {
        return ownerCount;
    }

    public void setOwnerCount(long ownerCount) {
        this.ownerCount = ownerCount;
    }

    public long getTenantCount() {
        return tenantCount;
    }

    public void setTenantCount(long tenantCount) {
        this.tenantCount = tenantCount;
    }
}
