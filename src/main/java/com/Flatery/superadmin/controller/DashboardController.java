package com.Flatery.superadmin.controller;

import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.DashboardStatsDto;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import com.Flatery.superadmin.service.DashboardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/superadmin/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final SuperAdminGuard superAdminGuard;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    /**
     * Get dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        
        // Load full User entity with roles
        User admin = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        superAdminGuard.requireSuperAdmin(admin);
        
        log.info("SuperAdmin {} accessing dashboard stats", admin.getUsername());
        auditLogService.logAction(admin, "VIEW_DASHBOARD", null, null, 
            "Viewed dashboard statistics", request);
        
        DashboardStatsDto stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health(@AuthenticationPrincipal User admin) {
        superAdminGuard.requireSuperAdmin(admin);
        return ResponseEntity.ok("SuperAdmin Dashboard Operational");
    }
}
