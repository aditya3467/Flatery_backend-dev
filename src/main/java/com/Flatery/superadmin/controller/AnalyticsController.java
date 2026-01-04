package com.Flatery.superadmin.controller;

import com.Flatery.superadmin.dto.AnalyticsOverviewDto;
import com.Flatery.superadmin.dto.CityAnalyticsDto;
import com.Flatery.superadmin.dto.TimeSeriesDataDto;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AnalyticsService;
import com.Flatery.superadmin.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller for SuperAdmin Analytics
 */
@RestController
@RequestMapping("/api/superadmin/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    private final AuditLogService auditLogService;
    
    /**
     * Get analytics overview
     */
    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewDto> getAnalyticsOverview(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        // Optional auth - allow if authenticated as superadmin
        if (userDetails != null) {
            SuperAdminGuard.requireSuperAdmin(userDetails);
            log.info("SuperAdmin {} fetching analytics overview", userDetails.getUsername());
        } else {
            log.info("Anonymous user fetching analytics overview (for testing)");
        }
        
        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        AnalyticsOverviewDto analytics = analyticsService.getAnalyticsOverview(startDate, endDate);
        
        if (userDetails != null) {
            auditLogService.log(
                    userDetails.getUsername(),
                    "VIEW_ANALYTICS_OVERVIEW",
                    "Analytics",
                    null,
                    "Viewed analytics overview from " + startDate + " to " + endDate
            );
        }
        
        return ResponseEntity.ok(analytics);
    }
    
    /**
     * Get user registration time series
     */
    @GetMapping("/users/time-series")
    public ResponseEntity<TimeSeriesDataDto> getUserRegistrationTimeSeries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "day") String interval
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching user registration time series", userDetails.getUsername());
        
        TimeSeriesDataDto timeSeries = analyticsService.getUserRegistrationTimeSeries(startDate, endDate, interval);
        
        return ResponseEntity.ok(timeSeries);
    }
    
    /**
     * Get property creation time series
     */
    @GetMapping("/properties/time-series")
    public ResponseEntity<TimeSeriesDataDto> getPropertyCreationTimeSeries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "day") String interval
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching property creation time series", userDetails.getUsername());
        
        TimeSeriesDataDto timeSeries = analyticsService.getPropertyCreationTimeSeries(startDate, endDate, interval);
        
        return ResponseEntity.ok(timeSeries);
    }
    
    /**
     * Get property views time series
     */
    @GetMapping("/views/time-series")
    public ResponseEntity<TimeSeriesDataDto> getPropertyViewsTimeSeries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "day") String interval
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching property views time series", userDetails.getUsername());
        
        TimeSeriesDataDto timeSeries = analyticsService.getPropertyViewsTimeSeries(startDate, endDate, interval);
        
        return ResponseEntity.ok(timeSeries);
    }
    
    /**
     * Get city-wise analytics
     */
    @GetMapping("/cities")
    public ResponseEntity<List<CityAnalyticsDto>> getCityAnalytics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching city-wise analytics", userDetails.getUsername());
        
        List<CityAnalyticsDto> cityAnalytics = analyticsService.getCityAnalytics();
        
        auditLogService.log(
                userDetails.getUsername(),
                "VIEW_CITY_ANALYTICS",
                "Analytics",
                null,
                "Viewed city-wise analytics"
        );
        
        return ResponseEntity.ok(cityAnalytics);
    }
}
