package com.Flatery.service.help;

import com.Flatery.dto.help.ComplaintStatsResponse;
import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.helpstatus;
import com.Flatery.repository.help.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for generating complaint statistics and reports
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintStatsService {

    private final ComplaintRepository complaintRepository;

    /**
     * Get tenant complaint statistics
     */
    @Transactional(readOnly = true)
    public ComplaintStatsResponse getTenantStats(Long tenantId) {
        List<Complaint> complaints = complaintRepository.findByTenantIdOrderBySubmittedAtDesc(tenantId);
        
        int total = complaints.size();
        int open = (int) complaints.stream().filter(c -> c.getStatus() == helpstatus.OPEN).count();
        int resolved = (int) complaints.stream().filter(c -> c.getStatus() == helpstatus.RESOLVED).count();

        return ComplaintStatsResponse.builder()
                .totalComplaints(total)
                .openComplaints(open)
                .resolvedComplaints(resolved)
                .averageResolutionTimeHours(0.0)
                .build();
    }

    /**
     * Get owner complaint statistics
     */
    @Transactional(readOnly = true)
    public ComplaintStatsResponse getOwnerStats(Long ownerId) {
        List<Complaint> complaints = complaintRepository.findByOwnerIdOrderBySubmittedAtDesc(ownerId);
        
        int total = complaints.size();
        int open = (int) complaints.stream().filter(c -> c.getStatus() == helpstatus.OPEN).count();
        int resolved = (int) complaints.stream().filter(c -> c.getStatus() == helpstatus.RESOLVED).count();

        return ComplaintStatsResponse.builder()
                .totalComplaints(total)
                .openComplaints(open)
                .resolvedComplaints(resolved)
                .averageResolutionTimeHours(0.0)
                .build();
    }
}
