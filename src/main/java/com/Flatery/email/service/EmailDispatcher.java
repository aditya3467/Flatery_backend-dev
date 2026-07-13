package com.Flatery.email.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailLog;
import com.Flatery.email.entity.EmailQueue;
import com.Flatery.email.entity.EmailTemplate;
import com.Flatery.email.repository.EmailLogRepository;
import com.Flatery.email.repository.EmailQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailDispatcher {

    private final EmailTemplateService templateService;
    private final EmailQueueRepository queueRepository;
    private final EmailLogRepository logRepository;

    public void dispatch(EmailType type, String recipient, Map<String, Object> data, Instant scheduledAt) {
        try {
            RenderedEmail renderedEmail = renderEmail(type, data);

            EmailQueue q = EmailQueue.builder()
                    .recipient(recipient)
                    .subject(renderedEmail.subject())
                    .bodyHtml(renderedEmail.html())
                    .bodyText(renderedEmail.text())
                    .emailType(type)
                    .status(EmailQueue.Status.PENDING)
                    .attempts(0)
                    .scheduledAt(scheduledAt != null ? scheduledAt : Instant.now())
                    .build();
            queueRepository.save(q);

            saveLogSafely(EmailLog.builder()
                    .emailId(q.getId())
                    .recipient(recipient)
                    .emailType(type)
                    .status("PENDING")
                    .build());

            log.info("Queued email id={} type={} to={} scheduledAt={}", q.getId(), type, recipient, q.getScheduledAt());
        } catch (Exception e) {
            log.error("Failed to dispatch email type={} to={} error={}", type, recipient, e.getMessage(), e);
            saveLogSafely(EmailLog.builder()
                    .recipient(recipient)
                    .emailType(type)
                    .status("FAILED")
                    .errorMessage(e.getMessage())
                    .build());
            throw e;
        }
    }

    private RenderedEmail renderEmail(EmailType type, Map<String, Object> data) {
        try {
            Optional<EmailTemplate> opt = templateService.getActiveTemplate(type);
            if (opt.isEmpty()) {
                throw new IllegalStateException("No active template");
            }

            EmailTemplate template = opt.get();
            Set<String> expected = templateService.getExpectedPlaceholders(template);
            templateService.validateAllPlaceholdersPresent(data, expected);

            String subject = templateService.render(template.getSubject(), data);
            String html = templateService.render(template.getHtmlBody(), data);
            String text = template.getTextBody() != null && !template.getTextBody().isBlank()
                    ? templateService.render(template.getTextBody(), data)
                    : html.replaceAll("<[^>]+>", "");

            return new RenderedEmail(subject, html, text);
        } catch (Exception e) {
            if (type != EmailType.EMAIL_VERIFICATION) {
                throw e;
            }
            log.warn("Using fallback EMAIL_VERIFICATION template: {}", e.getMessage());
            return renderFallbackVerificationEmail(data);
        }
    }

    private RenderedEmail renderFallbackVerificationEmail(Map<String, Object> data) {
        String userName = String.valueOf(data.getOrDefault("user_name", "there"));
        String verificationLink = String.valueOf(data.getOrDefault("verification_link", ""));
        String expiryHours = String.valueOf(data.getOrDefault("expiry_hours", "24"));
        String escapedUserName = escapeHtml(userName);
        String escapedVerificationLink = escapeHtml(verificationLink);
        String escapedExpiryHours = escapeHtml(expiryHours);

        String subject = "Verify your Flatery account";
        String html = "<html><body style=\"font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;\">"
                + "<div style=\"max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;\">"
                + "<h2 style=\"color:#333;\">Welcome to Flatery, " + escapedUserName + "!</h2>"
                + "<p style=\"color:#666;line-height:1.6;\">Please verify your email address to activate your account.</p>"
                + "<p style=\"margin:24px 0;\"><a href=\"" + escapedVerificationLink + "\" style=\"background:#007bff;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;\">Verify Email</a></p>"
                + "<p style=\"color:#666;line-height:1.6;\">This link is valid for " + escapedExpiryHours + " hours.</p>"
                + "<p style=\"color:#999;font-size:12px;\">If you did not create this account, you can ignore this email.</p>"
                + "</div></body></html>";
        String text = "Welcome to Flatery, " + userName + "!\n\n"
                + "Please verify your email address using this link:\n"
                + verificationLink + "\n\n"
                + "This link is valid for " + expiryHours + " hours.";

        return new RenderedEmail(subject, html, text);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private void saveLogSafely(EmailLog emailLog) {
        try {
            logRepository.save(emailLog);
        } catch (Exception e) {
            log.warn("Failed to save email log: {}", e.getMessage());
        }
    }

    private record RenderedEmail(String subject, String html, String text) {}
}
