package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    
    // Property Statistics
    private long totalProperties;
    private long liveProperties;
    private long draftProperties;
    private long blockedProperties;
    private long flatCount;
    private long pgCount;
    
    // User Statistics
    private long totalOwners;
    private long activeOwners;
    private long verifiedOwners;
    private long pendingOwnerVerifications;
    private long totalTenants;
    private long activeTenants;
    
    // Recent Activity
    private long propertiesAddedToday;
    private long propertiesAddedThisWeek;
    private long newOwnersToday;
    private long newTenantsToday;
    
    // Views Statistics
    private long totalViewsToday;
    private long totalViewsLast7Days;
    private long totalViewsLast30Days;
    
    // Verification Pending
    private long pendingPropertyVerifications;
    private long totalPendingVerifications;
}
