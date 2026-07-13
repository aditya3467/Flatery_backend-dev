package com.Flatery.email.repository;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    Optional<EmailTemplate> findFirstByTemplateKey(EmailType type);

    Optional<EmailTemplate> findFirstByTemplateKeyAndActiveTrue(EmailType type);
}
