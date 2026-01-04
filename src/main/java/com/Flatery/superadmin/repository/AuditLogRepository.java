package com.Flatery.superadmin.repository;

import com.Flatery.superadmin.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    Page<AuditLog> findByAdminIdOrderByCreatedAtDesc(Long adminId, Pageable pageable);
    
    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);
    
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId, Pageable pageable);
    
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :startDate AND :endDate ORDER BY al.createdAt DESC")
    Page<AuditLog> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.adminId = :adminId AND al.createdAt > :since")
    long countAdminActionsSince(Long adminId, LocalDateTime since);
    
    Page<AuditLog> findByAdminNameContainingIgnoreCaseOrderByCreatedAtDesc(String adminName, Pageable pageable);
    
    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);
}
