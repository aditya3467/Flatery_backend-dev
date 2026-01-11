package com.Flatery.email.entity;

import com.Flatery.email.EmailType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "email_templates",
        uniqueConstraints = @UniqueConstraint(name = "uq_template_key", columnNames = {"template_key"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_key", nullable = false, length = 64)
    private EmailType templateKey;

    @Column(nullable = false, length = 255)
    private String subject;

    @Lob
    @Column(name = "html_body", nullable = false, columnDefinition = "LONGTEXT")
    private String htmlBody;

    @Lob
    @Column(name = "text_body", columnDefinition = "LONGTEXT")
    private String textBody;

    @Lob
    @Column(name = "placeholders", columnDefinition = "LONGTEXT")
    private String placeholdersJson; // JSON array of strings

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
