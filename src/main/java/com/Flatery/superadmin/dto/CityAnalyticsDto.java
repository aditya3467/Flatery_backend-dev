package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for city-wise analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CityAnalyticsDto {
    private String cityName;
    private Long totalProperties;
    private Long activeProperties;
    private Long totalOwners;
    private Long totalTenants;
    private Long totalViews;
    private Double averageRent;
    private Double occupancyRate; // percentage
}
