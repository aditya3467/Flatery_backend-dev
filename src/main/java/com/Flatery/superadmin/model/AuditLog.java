package com.Flatery.superadmin.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_admin", columnList = "admin_id"),
    @Index(name = "idx_audit_action", columnList = "action_type"),
    @Index(name = "idx_audit_date", columnList = "created_at"),
    @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "admin_name", nullable = false)
    private String adminName;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // LOGIN, VERIFY_OWNER, BLOCK_PROPERTY, etc.

    @Column(name = "entity_type", length = 50)
    private String entityType; // OWNER, PROPERTY, TENANT, PLAN

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "changes", columnDefinition = "TEXT")
    private String changes; // JSON string of before/after

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
