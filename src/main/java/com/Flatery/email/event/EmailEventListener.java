package com.Flatery.email.event;

import com.Flatery.email.service.EmailDispatcher;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailEventListener {

    private final EmailDispatcher dispatcher;

    @EventListener
    public void onEmailDispatch(EmailDispatchEvent event) {
        dispatcher.dispatch(event.getType(), event.getRecipient(), event.getData(), event.getScheduledAt());
    }
}
