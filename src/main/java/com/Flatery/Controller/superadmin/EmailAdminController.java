package com.Flatery.Controller.superadmin;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailConfig;
import com.Flatery.email.entity.EmailLog;
import com.Flatery.email.entity.EmailTemplate;
import com.Flatery.email.repository.EmailConfigRepository;
import com.Flatery.email.repository.EmailLogRepository;
import com.Flatery.email.repository.EmailTemplateRepository;
import com.Flatery.email.service.EmailDispatcher;
import com.Flatery.email.service.EncryptionService;
import com.Flatery.email.service.SmtpSenderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/superadmin/email")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
public class EmailAdminController {

    private final EmailConfigRepository configRepository;
    private final EmailTemplateRepository templateRepository;
    private final EmailLogRepository logRepository;
    private final EncryptionService encryptionService;
    private final SmtpSenderService smtpSenderService;
    private final EmailDispatcher dispatcher;

    // ============ CONFIG ============
    @GetMapping("/config")
    public ResponseEntity<EmailConfig> getConfig() {
        return ResponseEntity.ok(configRepository.findAll().stream().findFirst().orElse(null));
    }

    @PostMapping("/config")
    public ResponseEntity<EmailConfig> upsertConfig(@Valid @RequestBody EmailConfigRequest req) {
        EmailConfig cfg = configRepository.findAll().stream().findFirst().orElse(new EmailConfig());
        cfg.setProvider(Optional.ofNullable(req.getProvider()).orElse("SMTP"));
        cfg.setHost(req.getHost());
        cfg.setPort(req.getPort());
        cfg.setUsername(req.getUsername());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            cfg.setEncryptedPassword(encryptionService.encrypt(req.getPassword()));
        } else if (cfg.getEncryptedPassword() == null) {
            throw new IllegalArgumentException("Password is required for initial setup");
        }
        cfg.setEncryption(req.getEncryption());
        cfg.setFromName(req.getFromName());
        cfg.setFromEmail(req.getFromEmail());
        cfg.setReplyTo(req.getReplyTo());
        cfg.setEnabled(Boolean.TRUE.equals(req.getEnabled()));
        cfg.setPaused(Boolean.TRUE.equals(req.getPaused()));
        configRepository.save(cfg);
        return ResponseEntity.ok(cfg);
    }

    @PostMapping("/config/test")
    public ResponseEntity<Map<String, Object>> sendTest(@Valid @RequestBody TestEmailRequest req) throws Exception {
        String id = smtpSenderService.send(req.getTo(), "Test Email", "<b>Flatery test email</b>", "Flatery test email");
        Map<String, Object> resp = new HashMap<>();
        resp.put("messageId", id);
        return ResponseEntity.ok(resp);
    }

    // ============ TEMPLATES ============
    @GetMapping("/templates")
    public ResponseEntity<List<EmailTemplate>> listTemplates() {
        return ResponseEntity.ok(templateRepository.findAll());
    }

    @PostMapping("/templates")
    public ResponseEntity<EmailTemplate> upsertTemplate(@Valid @RequestBody EmailTemplateUpsertRequest req) {
        EmailTemplate t = templateRepository.findFirstByTemplateKeyAndActiveTrue(req.getTemplateKey()).orElse(new EmailTemplate());
        t.setTemplateKey(req.getTemplateKey());
        t.setSubject(req.getSubject());
        t.setHtmlBody(req.getHtmlBody());
        t.setTextBody(req.getTextBody());
        if (req.getPlaceholders() != null) {
            t.setPlaceholdersJson(toJsonArray(req.getPlaceholders()));
        }
        t.setActive(Boolean.TRUE.equals(req.getActive()));
        t.setLastUpdatedBy(req.getUpdatedBy());
        templateRepository.save(t);
        return ResponseEntity.ok(t);
    }

    @PostMapping("/templates/{type}/activate")
    public ResponseEntity<Void> activate(@PathVariable("type") EmailType type) {
        Optional<EmailTemplate> t = templateRepository.findFirstByTemplateKeyAndActiveTrue(type);
        if (t.isEmpty()) return ResponseEntity.notFound().build();
        t.get().setActive(true);
        templateRepository.save(t.get());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/templates/{type}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable("type") EmailType type) {
        Optional<EmailTemplate> t = templateRepository.findFirstByTemplateKeyAndActiveTrue(type);
        if (t.isEmpty()) return ResponseEntity.notFound().build();
        t.get().setActive(false);
        templateRepository.save(t.get());
        return ResponseEntity.ok().build();
    }

    // ============ DISPATCH (MANUAL) ============
    @PostMapping("/dispatch")
    public ResponseEntity<Void> manualDispatch(@Valid @RequestBody ManualDispatchRequest req) {
        dispatcher.dispatch(req.getType(), req.getRecipient(), req.getData(), Optional.ofNullable(req.getScheduledAt()).orElse(Instant.now()));
        return ResponseEntity.accepted().build();
    }

    // ============ LOGS ============
    @GetMapping("/logs/recent")
    public ResponseEntity<List<EmailLog>> recentLogs() {
        return ResponseEntity.ok(logRepository.findAll().stream().sorted(Comparator.comparing(EmailLog::getCreatedAt).reversed()).limit(200).toList());
        // For simplicity; ideally add pageable query
    }

    private String toJsonArray(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append('"').append(list.get(i).replace("\"", "\\\"")).append('"');
            if (i < list.size() - 1) sb.append(',');
        }
        sb.append(']');
        return sb.toString();
    }

    // ====== DTOs ======
    @Data
    public static class EmailConfigRequest {
        private String provider;
        @NotBlank private String host;
        @NotNull private Integer port;
        @NotBlank private String username;
        private String password; // plain; encrypted before save
        @NotBlank private String encryption; // TLS or SSL
        @NotBlank private String fromName;
        @NotBlank @Email private String fromEmail;
        private String replyTo;
        private Boolean enabled = true;
        private Boolean paused = false;
    }

    @Data
    public static class EmailTemplateUpsertRequest {
        @NotNull private EmailType templateKey;
        @NotBlank private String subject;
        @NotBlank private String htmlBody;
        private String textBody;
        private List<String> placeholders;
        private Boolean active = true;
        private String updatedBy;
    }

    @Data
    public static class TestEmailRequest {
        @NotBlank @Email private String to;
    }

    @Data
    public static class ManualDispatchRequest {
        @NotNull private EmailType type;
        @NotBlank @Email private String recipient;
        @NotNull private Map<String, Object> data;
        private Instant scheduledAt;
    }
}
