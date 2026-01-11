package com.Flatery.email.service;

import com.Flatery.email.entity.EmailConfig;
import com.Flatery.email.repository.EmailConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Properties;

@Service
@RequiredArgsConstructor
public class EmailConfigService {

    private final EmailConfigRepository emailConfigRepository;
    private final EncryptionService encryptionService;

    public EmailConfig getActiveConfigOrThrow() {
        List<EmailConfig> all = emailConfigRepository.findAll();
        if (all.isEmpty()) {
            throw new IllegalStateException("Email configuration not set");
        }
        EmailConfig cfg = all.get(0); // single global config
        if (!cfg.isEnabled()) {
            throw new IllegalStateException("Email is globally disabled");
        }
        if (cfg.isPaused()) {
            throw new IllegalStateException("Email sending is paused");
        }
        return cfg;
    }

    public JavaMailSender buildSender(EmailConfig cfg) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(cfg.getHost());
        sender.setPort(cfg.getPort());
        sender.setUsername(cfg.getUsername());
        sender.setPassword(encryptionService.decrypt(cfg.getEncryptedPassword()));
        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        if ("SSL".equalsIgnoreCase(cfg.getEncryption())) {
            props.put("mail.smtp.ssl.enable", "true");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
        }
        props.put("mail.debug", "false");
        return sender;
    }
}
