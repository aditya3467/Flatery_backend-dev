package com.Flatery.scheduler;

import com.Flatery.repository.PasswordResetOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled task to clean up expired and used OTPs
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetOtpCleanupScheduler {

    private final PasswordResetOtpRepository otpRepository;

    /**
     * Delete expired OTPs every hour
     * Runs at: 0 0 * * * * (every hour at minute 0)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void deleteExpiredOtps() {
        try {
            log.info("Starting cleanup of expired OTPs");
            otpRepository.deleteExpiredOtps();
            log.info("Successfully cleaned up expired OTPs");
        } catch (Exception e) {
            log.error("Error during OTP cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Delete used and expired OTPs every 6 hours
     * Runs at: 0 0 0,6,12,18 * * * (every 6 hours)
     */
    @Scheduled(cron = "0 0 0,6,12,18 * * *")
    @Transactional
    public void deleteUsedAndExpiredOtps() {
        try {
            log.info("Starting cleanup of used and expired OTPs");
            otpRepository.deleteUsedAndExpiredOtps();
            log.info("Successfully cleaned up used and expired OTPs");
        } catch (Exception e) {
            log.error("Error during used OTP cleanup: {}", e.getMessage(), e);
        }
    }
}
