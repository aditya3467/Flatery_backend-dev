package com.Flatery.superadmin.controller;

import com.Flatery.superadmin.model.AuditLog;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * REST Controller for SuperAdmin Audit Log Viewer
 */
@RestController
@RequestMapping("/api/superadmin/audit-logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    
    /**
     * Get all audit logs with filters
     */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        // Optional auth - allow if authenticated as superadmin
        if (userDetails != null) {
            SuperAdminGuard.requireSuperAdmin(userDetails);
            log.info("SuperAdmin {} fetching audit logs", userDetails.getUsername());
        } else {
            log.info("Anonymous user fetching audit logs (for testing)");
        }
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<AuditLog> auditLogs = auditLogService.getAuditLogs(
                username, action, entityType, startDate, endDate, pageable
        );
        
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * Get audit log by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getAuditLogById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        if (userDetails != null) {
            SuperAdminGuard.requireSuperAdmin(userDetails);
            log.info("SuperAdmin {} fetching audit log ID: {}", userDetails.getUsername(), id);
        } else {
            log.info("Anonymous user fetching audit log ID: {} (for testing)", id);
        }
        
        AuditLog auditLog = auditLogService.getAuditLogById(id);
        return ResponseEntity.ok(auditLog);
    }
    
    /**
     * Get audit logs by username
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByUsername(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        if (userDetails != null) {
            SuperAdminGuard.requireSuperAdmin(userDetails);
            log.info("SuperAdmin {} fetching audit logs for user: {}", userDetails.getUsername(), username);
        } else {
            log.info("Anonymous user fetching audit logs for user: {} (for testing)", username);
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<AuditLog> auditLogs = auditLogService.getAuditLogsByUsername(username, pageable);
        
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * Get audit logs by action
     */
    @GetMapping("/action/{action}")
    public ResponseEntity<Page<AuditLog>> getAuditLogsByAction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching audit logs for action: {}", userDetails.getUsername(), action);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<AuditLog> auditLogs = auditLogService.getAuditLogsByAction(action, pageable);
        
        return ResponseEntity.ok(auditLogs);
    }
    
    /**
     * Get audit log statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAuditLogStatistics(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching audit log statistics", userDetails.getUsername());
        
        // Default to last 30 days
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }
        
        Map<String, Object> statistics = auditLogService.getAuditLogStatistics(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }
}
