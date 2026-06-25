package com.Flatery.scheduler;

import com.Flatery.repository.EmailVerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationTokenCleanupScheduler {

    private final EmailVerificationTokenRepository tokenRepository;

    /**
     * Daily cleanup for expired verification tokens.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredVerificationTokens() {
        int removed = tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Email verification token cleanup complete. Removed {} expired token(s)", removed);
    }
}
