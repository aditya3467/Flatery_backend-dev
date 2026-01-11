package com.Flatery.email.service;

import com.Flatery.email.entity.EmailConfig;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmtpSenderService {

    private final EmailConfigService emailConfigService;

    public String send(String to, String subject, String html, String text) throws Exception {
        EmailConfig cfg = emailConfigService.getActiveConfigOrThrow();
        JavaMailSender sender = emailConfigService.buildSender(cfg);
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
        helper.setFrom(cfg.getFromEmail(), cfg.getFromName());
        if (cfg.getReplyTo() != null && !cfg.getReplyTo().isBlank()) {
            helper.setReplyTo(cfg.getReplyTo());
        }
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, html);
        sender.send(msg);
        try {
            return msg.getMessageID();
        } catch (Exception ignored) {
            return null;
        }
    }
}
