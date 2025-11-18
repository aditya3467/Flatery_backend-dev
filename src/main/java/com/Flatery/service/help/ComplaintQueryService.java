package com.Flatery.service.help;

import com.Flatery.dto.help.ComplaintDetailResponse;
import com.Flatery.dto.help.ComplaintSummaryResponse;
import com.Flatery.exception.help.ComplaintNotFoundException;
import com.Flatery.exception.help.InvalidComplaintActionException;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.helpstatus;
import com.Flatery.repository.help.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for querying and fetching complaints
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintQueryService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintResponseService responseService;
    private final SLACalculationService slaService;

    /**
     * Get complaint by ID with access check
     */
    @Transactional(readOnly = true)
    public Complaint getComplaintByIdWithAccessCheck(Long id, Long userId, String role) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ComplaintNotFoundException("Complaint not found with ID: " + id));

        // Check access permission
        if (role.equals("USER") && !complaint.getTenantId().equals(userId)) {
            throw new InvalidComplaintActionException("You are not authorized to view this complaint");
        }

        if (role.equals("ADMIN") && !complaint.getOwnerId().equals(userId)) {
            throw new InvalidComplaintActionException("You are not authorized to view this complaint");
        }

        // Update SLA status before returning
        slaService.updateSLAStatus(complaint);

        return complaint;
    }

    /**
     * Get all complaints for tenant
     */
    @Transactional(readOnly = true)
    public List<Complaint> getTenantComplaints(Long tenantId, helpstatus status) {
        if (status != null) {
            return complaintRepository.findByTenantIdAndStatusOrderBySubmittedAtDesc(tenantId, status);
        }
        return complaintRepository.findByTenantIdOrderBySubmittedAtDesc(tenantId);
    }

    /**
     * Get all complaints for owner
     */
    @Transactional(readOnly = true)
    public List<Complaint> getOwnerComplaints(Long ownerId, helpstatus status) {
        if (status != null) {
            return complaintRepository.findByOwnerIdAndStatusOrderBySubmittedAtDesc(ownerId, Arrays.asList(status));
        }
        return complaintRepository.findByOwnerIdOrderBySubmittedAtDesc(ownerId);
    }

    /**
     * Get pending complaints for owner (OPEN, IN_PROGRESS, REOPENED)
     */
    @Transactional(readOnly = true)
    public List<Complaint> getOwnerPendingComplaints(Long ownerId) {
        List<helpstatus> pendingStatuses = Arrays.asList(
                helpstatus.OPEN,
                helpstatus.IN_PROGRESS,
                helpstatus.REOPENED
        );
        return complaintRepository.findByOwnerIdAndStatusOrderBySubmittedAtDesc(ownerId, pendingStatuses);
    }

    /**
     * Build complaint detail response
     */
    public ComplaintDetailResponse buildDetailResponse(Complaint complaint) {
        return ComplaintDetailResponse.builder()
                .id(complaint.getId())
                .complaintId(complaint.getComplaintId())
                .tenantId(complaint.getTenantId())
                .ownerId(complaint.getOwnerId())
                .propertyId(complaint.getPropertyId())
                .category(complaint.getCategory())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .attachmentUrl(complaint.getAttachmentUrl())
                .preferredResolutionDate(complaint.getPreferredResolutionDate())
                .slaDeadline(complaint.getSlaDeadline())
                .isSlaBreached(complaint.getIsSlaBreached())
                .actualResolutionDate(complaint.getActualResolutionDate())
                .reopenCount(complaint.getReopenCount())
                .submittedAt(complaint.getSubmittedAt())
                .responses(null)
                .timeline(null)
                .build();
    }

    /**
     * Build complaint summary response
     */
    public ComplaintSummaryResponse buildSummaryResponse(Complaint complaint) {
        return ComplaintSummaryResponse.builder()
                .id(complaint.getId())
                .complaintId(complaint.getComplaintId())
                .title(complaint.getTitle())
                .category(complaint.getCategory())
                .priority(complaint.getPriority())
                .status(complaint.getStatus())
                .submittedAt(complaint.getSubmittedAt())
                .slaDeadline(complaint.getSlaDeadline())
                .isSlaBreached(complaint.getIsSlaBreached())
                .build();
    }

    /**
     * Convert list of complaints to summary responses
     */
    public List<ComplaintSummaryResponse> toSummaryResponseList(List<Complaint> complaints) {
        return complaints.stream()
                .map(this::buildSummaryResponse)
                .collect(Collectors.toList());
    }
}
