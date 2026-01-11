package com.Flatery.email.event;

import com.Flatery.email.EmailType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.Instant;
import java.util.Map;

@Getter
public class EmailDispatchEvent extends ApplicationEvent {
    private final EmailType type;
    private final String recipient;
    private final Map<String, Object> data;
    private final Instant scheduledAt;

    public EmailDispatchEvent(Object source, EmailType type, String recipient, Map<String, Object> data, Instant scheduledAt) {
        super(source);
        this.type = type;
        this.recipient = recipient;
        this.data = data;
        this.scheduledAt = scheduledAt;
    }
}
