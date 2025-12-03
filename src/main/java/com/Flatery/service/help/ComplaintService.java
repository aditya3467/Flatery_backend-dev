package com.Flatery.service.help;

import com.Flatery.dto.help.*;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.Priority;
import com.Flatery.model.help.ResponseType;
import com.Flatery.model.help.helpstatus;
import com.Flatery.repository.help.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Main complaint service - orchestrates all complaint operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintFileService fileService;
    private final ComplaintStatusService statusService;
    private final ComplaintResponseService responseService;
    private final ComplaintQueryService queryService;
    private final SLACalculationService slaService;
    private final ComplaintStatsService statsService;
    private final com.Flatery.service.NotificationService notificationService;

    /**
     * Create new complaint
     */
    @Transactional
    public ComplaintDetailResponse createComplaint(ComplaintCreateRequest request,
                                                   Long tenantId, Long ownerId, Long propertyId,
                                                   MultipartFile file) {
        // Generate complaint ID
        String complaintId = generateComplaintId();

        // Upload file if present
        String attachmentUrl = null;
        if (file != null && !file.isEmpty()) {
            attachmentUrl = fileService.uploadFile(file, complaintId);
        }

        // Calculate priority and SLA
        Priority priority = slaService.calculatePriority(request.getCategory());
        LocalDateTime slaDeadline = slaService.calculateSLADeadline(request.getCategory(), LocalDateTime.now());

        // Build and save complaint
        Complaint complaint = Complaint.builder()
                .complaintId(complaintId)
                .tenantId(tenantId)
                .ownerId(ownerId)
                .propertyId(propertyId)
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(priority)
                .status(helpstatus.OPEN)
                .attachmentUrl(attachmentUrl)
                .preferredResolutionDate(request.getPreferredResolutionDate())
                .slaDeadline(slaDeadline)
                .isSlaBreached(false)
                .reopenCount(0)
                .submittedAt(LocalDateTime.now())
                .createdBy(String.valueOf(tenantId))
                .build();

        complaint = complaintRepository.save(complaint);

        // Create initial status history
        statusService.createInitialHistory(complaint);

        log.info("Complaint created: {} for tenant: {}", complaintId, tenantId);

        // Notify owner when tenant raises a complaint
        if (ownerId != null) {
            notificationService.createNotification(
                ownerId,
                tenantId,
                "COMPLAINT_CREATED",
                "New Complaint Raised",
                "A new complaint has been raised by a tenant: " + complaint.getTitle(),
                "/owner/flat-dashboard.html#complaints"
            );
        }

        return queryService.buildDetailResponse(complaint);
    }

    /**
     * Get complaint by ID
     */
    @Transactional(readOnly = true)
    public ComplaintDetailResponse getComplaintById(Long id, Long userId, String role) {
        Complaint complaint = queryService.getComplaintByIdWithAccessCheck(id, userId, role);
        return queryService.buildDetailResponse(complaint);
    }

    /**
     * Get tenant complaints
     */
    @Transactional(readOnly = true)
    public List<ComplaintSummaryResponse> getTenantComplaints(Long tenantId, helpstatus status) {
        List<Complaint> complaints = queryService.getTenantComplaints(tenantId, status);
        return queryService.toSummaryResponseList(complaints);
    }

    /**
     * Get owner complaints
     */
    @Transactional(readOnly = true)
    public List<ComplaintSummaryResponse> getOwnerComplaints(Long ownerId, helpstatus status) {
        List<Complaint> complaints = queryService.getOwnerComplaints(ownerId, status);
        return queryService.toSummaryResponseList(complaints);
    }

    /**
     * Get owner pending complaints
     */
    @Transactional(readOnly = true)
    public List<ComplaintSummaryResponse> getOwnerPendingComplaints(Long ownerId) {
        List<Complaint> complaints = queryService.getOwnerPendingComplaints(ownerId);
        return queryService.toSummaryResponseList(complaints);
    }

    /**
     * Update complaint status
     */
    @Transactional
    public ComplaintDetailResponse updateComplaintStatus(Long id, ComplaintUpdateStatusRequest request, Long ownerId) {
        Complaint complaint = queryService.getComplaintByIdWithAccessCheck(id, ownerId, "ADMIN");

        statusService.updateStatus(complaint, request.getNewStatus(), ownerId, request.getReason());

        // Add response if message provided
        if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            responseService.addOwnerComment(complaint, ownerId, request.getMessage());
        }

        // Notify tenant when owner changes status
        if (complaint.getTenantId() != null) {
            notificationService.createNotification(
                complaint.getTenantId(),
                ownerId,
                "COMPLAINT_STATUS_UPDATE",
                "Complaint Status Updated",
                "Your complaint status was updated to " + request.getNewStatus(),
                "/tenant-dashboard.html#complaints"
            );
        }
        return queryService.buildDetailResponse(complaint);
    }

    /**
     * Verify resolution
     */
    @Transactional
    public ComplaintDetailResponse verifyResolution(Long id, Long tenantId) {
        Complaint complaint = queryService.getComplaintByIdWithAccessCheck(id, tenantId, "USER");
        statusService.verifyResolution(complaint, tenantId);

        // Notify owner when tenant verifies resolution (status changes to CLOSED)
        if (complaint.getOwnerId() != null) {
            notificationService.createNotification(
                complaint.getOwnerId(),
                tenantId,
                "COMPLAINT_STATUS_UPDATE",
                "Complaint Closed by Tenant",
                "A complaint was closed by the tenant: " + complaint.getTitle(),
                "/owner/flat-dashboard.html#complaints"
            );
        }
        return queryService.buildDetailResponse(complaint);
    }

    /**
     * Reopen complaint
     */
    @Transactional
    public ComplaintDetailResponse reopenComplaint(Long id, ComplaintReopenRequest request, Long tenantId) {
        Complaint complaint = queryService.getComplaintByIdWithAccessCheck(id, tenantId, "USER");
        statusService.reopenComplaint(complaint, tenantId, request.getReason());

        // Notify owner when tenant reopens complaint
        if (complaint.getOwnerId() != null) {
            notificationService.createNotification(
                complaint.getOwnerId(),
                tenantId,
                "COMPLAINT_STATUS_UPDATE",
                "Complaint Reopened by Tenant",
                "A complaint was reopened by the tenant: " + complaint.getTitle(),
                "/owner/flat-dashboard.html#complaints"
            );
        }
        return queryService.buildDetailResponse(complaint);
    }

    /**
     * Add response to complaint
     */
    @Transactional
    public void addComplaintResponse(Long id, Long userId, String message,
                                     ResponseType responseType, boolean isOwnerResponse) {
        String role = isOwnerResponse ? "ADMIN" : "USER";
        Complaint complaint = queryService.getComplaintByIdWithAccessCheck(id, userId, role);

        responseService.validateResponse(message);
        responseService.addResponse(complaint, userId, message, responseType, isOwnerResponse);
    }

    /**
     * Get tenant statistics
     */
    @Transactional(readOnly = true)
    public ComplaintStatsResponse getTenantStats(Long tenantId) {
        return statsService.getTenantStats(tenantId);
    }

    /**
     * Get owner statistics
     */
    @Transactional(readOnly = true)
    public ComplaintStatsResponse getOwnerStats(Long ownerId) {
        return statsService.getOwnerStats(ownerId);
    }

    /**
     * Generate unique complaint ID
     */
    private String generateComplaintId() {
        long count = complaintRepository.count() + 1;
        return String.format("CMP%s%03d",
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")),
                count);
    }
}
