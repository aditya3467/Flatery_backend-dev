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
            Optional<EmailTemplate> opt = templateService.getActiveTemplate(type);
            if (opt.isEmpty()) {
                log.warn("No active template for type={}, skipping", type);
                logRepository.save(EmailLog.builder()
                        .emailType(type)
                        .recipient(recipient)
                        .status("SKIPPED")
                        .errorMessage("No active template")
                        .build());
                return;
            }
            EmailTemplate template = opt.get();

            Set<String> expected = templateService.getExpectedPlaceholders(template);
            templateService.validateAllPlaceholdersPresent(data, expected);

            String subject = templateService.render(template.getSubject(), data);
            String html = templateService.render(template.getHtmlBody(), data);
            String text = template.getTextBody() != null && !template.getTextBody().isBlank()
                    ? templateService.render(template.getTextBody(), data)
                    : html.replaceAll("<[^>]+>", "");

            EmailQueue q = EmailQueue.builder()
                    .recipient(recipient)
                    .subject(subject)
                    .bodyHtml(html)
                    .bodyText(text)
                    .emailType(type)
                    .status(EmailQueue.Status.PENDING)
                    .attempts(0)
                    .scheduledAt(scheduledAt != null ? scheduledAt : Instant.now())
                    .build();
            queueRepository.save(q);

            logRepository.save(EmailLog.builder()
                    .emailId(q.getId())
                    .recipient(recipient)
                    .emailType(type)
                    .status("PENDING")
                    .build());

            log.info("Queued email id={} type={} to={} scheduledAt={}", q.getId(), type, recipient, q.getScheduledAt());
        } catch (Exception e) {
            log.error("Failed to dispatch email type={} to={} error={}", type, recipient, e.getMessage(), e);
            logRepository.save(EmailLog.builder()
                    .recipient(recipient)
                    .emailType(type)
                    .status("FAILED")
                    .errorMessage(e.getMessage())
                    .build());
            throw e;
        }
    }
}
