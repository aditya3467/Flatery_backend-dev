package com.Flatery.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantPropertyDetails {
    
    // Property Information
    private Long propertyId;
    private String propertyName;
    private String address;
    private String city;
    private String state;
    private String propertyType;
    private Integer totalFloors;
    private String description;
    
    // Unit/Room Information
    private Long unitId;
    private String unitCode;
    private String unitType;
    private Integer capacity;
    private String status;
    
    // Floor Information
    private Long floorId;
    private String floorName;
    private Integer floorNumber;
    
    // Owner Information
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
    
    // Tenant-specific Information
    private Integer rentAmount;
    private Integer securityDeposit;
    private Integer rentDueDate;
    private String leaseStartDate;
    private String leaseEndDate;
    private String tenantStatus;
    
    // Amenities
    private List<AmenityDto> amenities;
    
    // Property Rules (if available)
    private List<String> rules;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityDto {
        private Long id;
        private String name;
        private String description;
        private String icon;
    }
}