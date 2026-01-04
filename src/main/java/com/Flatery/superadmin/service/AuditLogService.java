package com.Flatery.superadmin.service;

import com.Flatery.model.User;
import com.Flatery.superadmin.model.AuditLog;
import com.Flatery.superadmin.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an admin action
     */
    @Transactional
    public void logAction(User admin, String actionType, String entityType, Long entityId, 
                         String description, HttpServletRequest request) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .adminId(admin.getId())
                .adminName(admin.getFirstName() + " " + admin.getLastName())
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .build();
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created: {} by {} on {} {}", actionType, admin.getFirstName(), entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to create audit log", e);
        }
    }

    /**
     * Log action with changes tracking
     */
    @Transactional
    public void logActionWithChanges(User admin, String actionType, String entityType, Long entityId,
                                     String description, String changes, HttpServletRequest request) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .adminId(admin.getId())
                .adminName(admin.getFirstName() + " " + admin.getLastName())
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .changes(changes)
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .build();
            
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to create audit log with changes", e);
        }
    }

    /**
     * Get audit logs with pagination
     */
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    /**
     * Get audit logs by admin
     */
    public Page<AuditLog> getAuditLogsByAdmin(Long adminId, Pageable pageable) {
        return auditLogRepository.findByAdminIdOrderByCreatedAtDesc(adminId, pageable);
    }

    /**
     * Get audit logs by action type
     */
    public Page<AuditLog> getAuditLogsByAction(String actionType, Pageable pageable) {
        return auditLogRepository.findByActionTypeOrderByCreatedAtDesc(actionType, pageable);
    }

    /**
     * Get audit logs for specific entity
     */
    public Page<AuditLog> getEntityAuditLogs(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable);
    }

    /**
     * Get audit logs by date range
     */
    public Page<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return auditLogRepository.findByDateRange(startDate, endDate, pageable);
    }

    /**
     * Extract client IP from request
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null && ip.contains(",") ? ip.split(",")[0].trim() : ip;
    }
    
    /**
     * Simple log method for non-HttpServletRequest contexts
     */
    @Transactional
    public void log(String username, String actionType, String entityType, Long entityId, String description) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .adminId(null)
                .adminName(username)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .ipAddress("N/A")
                .userAgent("N/A")
                .build();
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created: {} by {} on {} {}", actionType, username, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to create audit log", e);
        }
    }
    
    /**
     * Get audit logs with comprehensive filters
     */
    public Page<AuditLog> getAuditLogs(String username, String action, String entityType,
                                       LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        if (startDate != null && endDate != null) {
            return auditLogRepository.findByDateRange(startDate, endDate, pageable);
        } else if (username != null) {
            return auditLogRepository.findByAdminNameContainingIgnoreCaseOrderByCreatedAtDesc(username, pageable);
        } else if (action != null) {
            return auditLogRepository.findByActionTypeOrderByCreatedAtDesc(action, pageable);
        } else if (entityType != null) {
            return auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
        }
        return auditLogRepository.findAll(pageable);
    }
    
    /**
     * Get audit log by ID
     */
    public AuditLog getAuditLogById(Long id) {
        return auditLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Audit log not found"));
    }
    
    /**
     * Get audit logs by username
     */
    public Page<AuditLog> getAuditLogsByUsername(String username, Pageable pageable) {
        return auditLogRepository.findByAdminNameContainingIgnoreCaseOrderByCreatedAtDesc(username, pageable);
    }
    
    /**
     * Get audit log statistics
     */
    public java.util.Map<String, Object> getAuditLogStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        java.util.List<AuditLog> logs = auditLogRepository.findAll().stream()
                .filter(log -> log.getCreatedAt().isAfter(startDate) && log.getCreatedAt().isBefore(endDate))
                .toList();
        
        long totalActions = logs.size();
        long uniqueAdmins = logs.stream().map(AuditLog::getAdminName).distinct().count();
        java.util.Map<String, Long> actionCounts = logs.stream()
                .collect(java.util.stream.Collectors.groupingBy(AuditLog::getActionType, java.util.stream.Collectors.counting()));
        java.util.Map<String, Long> entityCounts = logs.stream()
                .collect(java.util.stream.Collectors.groupingBy(AuditLog::getEntityType, java.util.stream.Collectors.counting()));
        
        return java.util.Map.of(
                "totalActions", totalActions,
                "uniqueAdmins", uniqueAdmins,
                "actionCounts", actionCounts,
                "entityCounts", entityCounts,
                "startDate", startDate,
                "endDate", endDate
        );
    }
}
