package com.Flatery.service.help;

import com.Flatery.exception.help.InvalidComplaintActionException;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.ComplaintStatusHistory;
import com.Flatery.model.help.helpstatus;
import com.Flatery.repository.help.ComplaintRepository;
import com.Flatery.repository.help.ComplaintStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.Set;

/**
 * Service for handling complaint status transitions and validation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintStatusService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;
    private final SLACalculationService slaService;


    // Valid status transitions
    private static final Set<helpstatus> OPEN_TRANSITIONS = EnumSet.of(helpstatus.IN_PROGRESS, helpstatus.RESOLVED);
    private static final Set<helpstatus> IN_PROGRESS_TRANSITIONS = EnumSet.of(helpstatus.RESOLVED);
    private static final Set<helpstatus> RESOLVED_TRANSITIONS = EnumSet.of(helpstatus.CLOSED, helpstatus.REOPENED);
    private static final Set<helpstatus> REOPENED_TRANSITIONS = EnumSet.of(helpstatus.IN_PROGRESS, helpstatus.RESOLVED);

    /**
     * Validate status transition
     */
    public void validateStatusTransition(helpstatus currentStatus, helpstatus newStatus) {
        Set<helpstatus> allowedTransitions = switch (currentStatus) {
            case OPEN -> OPEN_TRANSITIONS;
            case IN_PROGRESS -> IN_PROGRESS_TRANSITIONS;
            case RESOLVED -> RESOLVED_TRANSITIONS;
            case REOPENED -> REOPENED_TRANSITIONS;
            case CLOSED -> EnumSet.noneOf(helpstatus.class);
        };

        if (!allowedTransitions.contains(newStatus)) {
            throw new InvalidComplaintActionException(
                    String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    /**
     * Update complaint status
     */
    @Transactional
    public void updateStatus(Complaint complaint, helpstatus newStatus, Long userId, String reason) {
        validateStatusTransition(complaint.getStatus(), newStatus);

        helpstatus previousStatus = complaint.getStatus();
        complaint.setStatus(newStatus);
        complaint.setUpdatedBy(String.valueOf(userId));

        if (newStatus == helpstatus.RESOLVED && complaint.getActualResolutionDate() == null) {
            complaint.setActualResolutionDate(LocalDateTime.now());
        }

        slaService.updateSLAStatus(complaint);
        complaintRepository.save(complaint);
        createStatusHistory(complaint, previousStatus, newStatus, userId, reason);

        log.info("Complaint {} status updated from {} to {} by user {}",
                complaint.getComplaintId(), previousStatus, newStatus, userId);
    }

    /**
     * Verify resolution
     */
    @Transactional
    public void verifyResolution(Complaint complaint, Long tenantId) {
        if (complaint.getStatus() != helpstatus.RESOLVED) {
            throw new InvalidComplaintActionException(
                    "Only RESOLVED complaints can be verified. Current status: " + complaint.getStatus());
        }

        if (!complaint.getTenantId().equals(tenantId)) {
            throw new InvalidComplaintActionException("Only the complaint creator can verify resolution");
        }

        updateStatus(complaint, helpstatus.CLOSED, tenantId, "Tenant verified resolution");
    }

    /**
     * Reopen complaint
     */
    @Transactional
    public void reopenComplaint(Complaint complaint, Long tenantId, String reason) {
        if (complaint.getStatus() != helpstatus.RESOLVED) {
            throw new InvalidComplaintActionException(
                    "Only RESOLVED complaints can be reopened. Current status: " + complaint.getStatus());
        }

        if (!complaint.getTenantId().equals(tenantId)) {
            throw new InvalidComplaintActionException("Only the complaint creator can reopen");
        }

        if (complaint.getActualResolutionDate() != null) {
            long daysSinceResolution = ChronoUnit.DAYS.between(
                    complaint.getActualResolutionDate(), LocalDateTime.now());

            if (daysSinceResolution > 7) {
                throw new InvalidComplaintActionException(
                        "Complaint can only be reopened within 7 days of resolution");
            }
        }

        if (complaint.getReopenCount() >= 2) {
            throw new InvalidComplaintActionException(
                    "Complaint has already been reopened maximum times (2)");
        }

        complaint.setReopenCount(complaint.getReopenCount() + 1);
        complaint.setActualResolutionDate(null);

        updateStatus(complaint, helpstatus.REOPENED, tenantId, reason);

        log.warn("Complaint {} reopened by tenant {}. Reopen count: {}",
                complaint.getComplaintId(), tenantId, complaint.getReopenCount());
    }

    /**
     * Create status history record
     */
    @Transactional
    public void createStatusHistory(Complaint complaint, helpstatus previousStatus,
                                    helpstatus newStatus, Long userId, String reason) {
        ComplaintStatusHistory history = ComplaintStatusHistory.builder()
                .complaintId(complaint.getId())
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .changedBy(userId)
                .changedAt(LocalDateTime.now())
                .reason(reason)
                .build();

        statusHistoryRepository.save(history);
    }

    /**
     * Create initial status history for new complaint
     */
    @Transactional
    public void createInitialHistory(Complaint complaint) {
        ComplaintStatusHistory history = ComplaintStatusHistory.builder()
                .complaintId(complaint.getId())
                .previousStatus(null)
                .newStatus(helpstatus.OPEN)
                .changedBy(Long.valueOf(complaint.getCreatedBy()))
                .changedAt(complaint.getSubmittedAt())
                .reason("Complaint submitted")
                .build();

        statusHistoryRepository.save(history);
    }

    /**
     * Check if complaint can be reopened
     */
    public boolean canReopen(Complaint complaint) {
        if (complaint.getStatus() != helpstatus.RESOLVED) {
            return false;
        }

        if (complaint.getReopenCount() >= 2) {
            return false;
        }

        if (complaint.getActualResolutionDate() != null) {
            long daysSinceResolution = ChronoUnit.DAYS.between(
                    complaint.getActualResolutionDate(), LocalDateTime.now());
            return daysSinceResolution <= 7;
        }

        return true;
    }

}
