package com.Flatery.scheduler;

import com.Flatery.email.EmailType;
import com.Flatery.email.service.EmailDispatcher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.scheduler.rent-reminders.enabled", havingValue = "true", matchIfMissing = false)
public class RentReminderScheduler {

    private final EmailDispatcher dispatcher;

    // Runs daily at 09:00 server time
    @Scheduled(cron = "0 0 9 * * *")
    public void runDaily() {
        // TODO: Inject service to fetch tenants with due rent and iterate.
        // Example placeholder dispatch for illustration only (disabled by property by default)
        log.info("Rent reminder scheduler tick - implement domain query to enqueue reminders");
        // Map<String, Object> data = new HashMap<>();
        // data.put("tenant_name", "John");
        // data.put("rent_amount", "₹10,000");
        // data.put("due_date", "2026-01-15");
        // dispatcher.dispatch(EmailType.RENT_DUE_REMINDER, "tenant@example.com", data, Instant.now());
    }
}
