package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for analytics overview data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDto {
    // Time period
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    // User growth
    private Long totalNewUsers;
    private Long newOwners;
    private Long newTenants;
    private Double userGrowthRate; // percentage
    
    // Property stats
    private Long totalNewProperties;
    private Long activeProperties;
    private Long inactiveProperties;
    private Double propertyGrowthRate; // percentage
    
    // Revenue (if applicable)
    private Double totalRevenue;
    private Double averagePropertyValue;
    
    // Engagement metrics
    private Long totalPropertyViews;
    private Long totalEnquiries;
    private Long totalComplaints;
    private Double averageViewsPerProperty;
    
    // User activity
    private Long activeUsersCount;
    private Double averageSessionDuration; // in minutes
    
    // Top performers
    private Map<String, Long> topCitiesByProperties;
    private Map<String, Long> topPropertyTypes;
}
