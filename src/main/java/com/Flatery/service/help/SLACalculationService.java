package com.Flatery.service.help;

import com.Flatery.model.help.Category;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.Priority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for calculating SLA deadlines and priorities
 */
@Service
@Slf4j
public class SLACalculationService {

    /**
     * Calculate priority based on category
     */
    public Priority calculatePriority(Category category) {
        return switch (category) {
            case WATER, ELECTRICITY -> Priority.URGENT;
            case PEST_CONTROL, SECURITY -> Priority.HIGH;
            case CLEANING, MAINTENANCE -> Priority.MEDIUM;
            case OTHERS -> Priority.LOW;
        };
    }

    /**
     * Calculate SLA deadline based on category
     */
    public LocalDateTime calculateSLADeadline(Category category, LocalDateTime startTime) {
        int hoursToAdd = getSLAHoursByCategory(category);
        return startTime.plusHours(hoursToAdd);
    }

    /**
     * Get SLA hours by category
     */
    public int getSLAHoursByCategory(Category category) {
        return switch (category) {
            case WATER, ELECTRICITY -> 4;  // 4 hours for critical
            case PEST_CONTROL, SECURITY -> 24; // 1 day
            case CLEANING, MAINTENANCE -> 48; // 2 days
            case OTHERS -> 72; // 3 days
        };
    }

    /**
     * Check if complaint has breached SLA
     */
    public boolean isSLABreached(Complaint complaint) {
        if (complaint.getSlaDeadline() == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        // If resolved, check against resolution time
        if (complaint.getActualResolutionDate() != null) {
            return complaint.getActualResolutionDate().isAfter(complaint.getSlaDeadline());
        }

        // If still open, check against current time
        return now.isAfter(complaint.getSlaDeadline());
    }

    /**
     * Update SLA breach status
     */
    public void updateSLAStatus(Complaint complaint) {
        boolean isBreached = isSLABreached(complaint);
        complaint.setIsSlaBreached(isBreached);

        if (isBreached) {
            log.warn("SLA breached for complaint: {}", complaint.getComplaintId());
        }
    }

    /**
     * Calculate time to SLA deadline in hours
     */
    public long getHoursUntilSLADeadline(Complaint complaint) {
        if (complaint.getSlaDeadline() == null) {
            return -1;
        }

        LocalDateTime now = LocalDateTime.now();
        return java.time.Duration.between(now, complaint.getSlaDeadline()).toHours();
    }
}
