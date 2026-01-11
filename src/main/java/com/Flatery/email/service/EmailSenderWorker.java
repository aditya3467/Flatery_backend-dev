package com.Flatery.email.service;

import com.Flatery.email.entity.EmailLog;
import com.Flatery.email.entity.EmailQueue;
import com.Flatery.email.repository.EmailLogRepository;
import com.Flatery.email.repository.EmailQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailSenderWorker {

    private final EmailQueueRepository queueRepository;
    private final EmailLogRepository logRepository;
    private final SmtpSenderService smtpSenderService;

    private static final int MAX_ATTEMPTS = 3;

    // Run every 30 seconds
    @Scheduled(fixedDelay = 30000)
    public void processQueue() {
        List<EmailQueue> pending = queueRepository.findPending(Instant.now());
        for (EmailQueue e : pending) {
            try {
                String messageId = smtpSenderService.send(e.getRecipient(), e.getSubject(), e.getBodyHtml(), e.getBodyText());
                e.setStatus(EmailQueue.Status.SENT);
                e.setAttempts(e.getAttempts() + 1);
                queueRepository.save(e);

                logRepository.save(EmailLog.builder()
                        .emailId(e.getId())
                        .recipient(e.getRecipient())
                        .emailType(e.getEmailType())
                        .status("SENT")
                        .sentAt(Instant.now())
                        .providerResponse(messageId)
                        .build());
            } catch (Exception ex) {
                log.warn("Email send failed id={} attempt={} error={}", e.getId(), e.getAttempts() + 1, ex.getMessage());
                e.setAttempts(e.getAttempts() + 1);
                if (e.getAttempts() >= MAX_ATTEMPTS) {
                    e.setStatus(EmailQueue.Status.FAILED);
                } else {
                    // backoff: 5, 15, 30 minutes
                    int minutes = e.getAttempts() == 1 ? 5 : (e.getAttempts() == 2 ? 15 : 30);
                    e.setScheduledAt(Instant.now().plus(minutes, ChronoUnit.MINUTES));
                }
                e.setLastError(ex.getMessage());
                queueRepository.save(e);

                logRepository.save(EmailLog.builder()
                        .emailId(e.getId())
                        .recipient(e.getRecipient())
                        .emailType(e.getEmailType())
                        .status("FAILED")
                        .errorMessage(ex.getMessage())
                        .build());
            }
        }
    }
}
