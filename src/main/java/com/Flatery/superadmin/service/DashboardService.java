package com.Flatery.superadmin.service;

import com.Flatery.model.RoleName;
import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.property.PropertyViewRepository;
import com.Flatery.repository.tenant.TenantRepository;
import com.Flatery.superadmin.dto.DashboardStatsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PropertyViewRepository propertyViewRepository;

    /**
     * Get comprehensive dashboard statistics
     */
    public DashboardStatsDto getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startOf7DaysAgo = now.minusDays(7);
        LocalDateTime startOf30DaysAgo = now.minusDays(30);

        // Property counts
        long totalProperties = propertyRepository.count();
        long liveProperties = 0;
        long draftProperties = 0;
        long blockedProperties = 0;
        long flatCount = 0;
        long pgCount = 0;
        
        try {
            liveProperties = propertyRepository.countByStatus(PropertyStatus.ACTIVE);
        } catch (Exception e) {
            log.warn("Could not get live properties count", e);
        }
        
        try {
            draftProperties = propertyRepository.countByStatus(PropertyStatus.INACTIVE);
        } catch (Exception e) {
            log.warn("Could not get draft properties count", e);
        }
        
        try {
            blockedProperties = 0; // No UNAVAILABLE status
        } catch (Exception e) {
            log.warn("Could not get blocked properties count", e);
        }
        
        try {
            flatCount = propertyRepository.countByType(PropertyType.FLAT);
        } catch (Exception e) {
            log.warn("Could not get flat count", e);
        }
        
        try {
            pgCount = propertyRepository.countByType(PropertyType.PG);
        } catch (Exception e) {
            log.warn("Could not get PG count", e);
        }

        // Owner counts
        long totalOwners = userRepository.countByRole(RoleName.ADMIN); // Using ADMIN as owner role
        
        // Tenant counts
        long totalTenants = tenantRepository.count();
        long activeTenants = totalTenants; // All tenants considered active for now

        // Views statistics
        long viewsToday = 0;
        long views7Days = 0;
        long views30Days = 0;
        
        try {
            viewsToday = propertyViewRepository.countByViewedAtAfter(startOfToday);
        } catch (Exception e) {
            log.warn("Could not get today's views", e);
        }
        
        try {
            views7Days = propertyViewRepository.countByViewedAtAfter(startOf7DaysAgo);
        } catch (Exception e) {
            log.warn("Could not get 7 days views", e);
        }
        
        try {
            views30Days = propertyViewRepository.countByViewedAtAfter(startOf30DaysAgo);
        } catch (Exception e) {
            log.warn("Could not get 30 days views", e);
        }

        return DashboardStatsDto.builder()
            // Property Statistics
            .totalProperties(totalProperties)
            .liveProperties(liveProperties)
            .draftProperties(draftProperties)
            .blockedProperties(blockedProperties)
            .flatCount(flatCount)
            .pgCount(pgCount)
            
            // User Statistics
            .totalOwners(totalOwners)
            .activeOwners(totalOwners) // All owners are active for now
            .verifiedOwners(0L) // TODO: Add verification tracking
            .pendingOwnerVerifications(0L)
            .totalTenants(totalTenants)
            .activeTenants(activeTenants)
            
            // Recent Activity
            .propertiesAddedToday(0L) // TODO: Add createdAt tracking
            .propertiesAddedThisWeek(0L)
            .newOwnersToday(0L)
            .newTenantsToday(0L)
            
            // Views Statistics
            .totalViewsToday(viewsToday)
            .totalViewsLast7Days(views7Days)
            .totalViewsLast30Days(views30Days)
            
            // Verification Pending
            .pendingPropertyVerifications(0L)
            .totalPendingVerifications(0L)
            
            .build();
    }
}
