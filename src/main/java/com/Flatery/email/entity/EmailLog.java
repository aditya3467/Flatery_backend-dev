package com.Flatery.email.entity;

import com.Flatery.email.EmailType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "email_logs", indexes = {
        @Index(name = "idx_logs_type_time", columnList = "email_type, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_id")
    private Long emailId; // reference to EmailQueue.id

    @Column(nullable = false)
    private String recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false, length = 64)
    private EmailType emailType;

    @Column(nullable = false)
    private String status; // PENDING / SENT / FAILED / SKIPPED

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "error_message", length = 1024)
    private String errorMessage;

    @Lob
    @Column(name = "provider_response", columnDefinition = "LONGTEXT")
    private String providerResponse;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
