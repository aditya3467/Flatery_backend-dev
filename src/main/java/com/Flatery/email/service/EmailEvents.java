package com.Flatery.email.service;

import com.Flatery.email.EmailType;
import com.Flatery.email.event.EmailDispatchEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailEvents {

    private final ApplicationEventPublisher publisher;

    public void publish(EmailType type, String recipient, Map<String, Object> data) {
        publish(type, recipient, data, Instant.now());
    }

    public void publish(EmailType type, String recipient, Map<String, Object> data, Instant scheduledAt) {
        publisher.publishEvent(new EmailDispatchEvent(this, type, recipient, data, scheduledAt));
    }
}
