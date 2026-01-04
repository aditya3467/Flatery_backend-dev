package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for subscription plan
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanDto {
    private Long id;
    private String planName;
    private String description;
    private Double priceMonthly;
    private Double priceYearly;
    private Integer maxProperties;
    private Integer maxTenants;
    private Integer maxImages;
    private Boolean allowPremiumSupport;
    private Boolean allowAnalytics;
    private Boolean allowCustomBranding;
    private Boolean isActive;
    private Long totalSubscribers;
}
