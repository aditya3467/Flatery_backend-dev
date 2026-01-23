package com.Flatery.superadmin.service;

import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.helpstatus;
import com.Flatery.model.help.Priority;
import com.Flatery.model.property.Property;
import com.Flatery.model.User;
import com.Flatery.repository.help.ComplaintRepository;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.ComplaintDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing complaints in SuperAdmin panel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintManagementService {
    
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    
    /**
     * Get all complaints with pagination and filters
     */
    public Page<ComplaintDto> getAllComplaints(
            helpstatus status,
            Priority priority,
            String category,
            String search,
            Pageable pageable
    ) {
        log.info("Fetching complaints with filters - status: {}, priority: {}, category: {}, search: {}", 
                status, priority, category, search);
        
        Page<Complaint> complaints;
        
        if (status != null) {
            complaints = complaintRepository.findByStatus(status, pageable);
        } else if (priority != null) {
            complaints = complaintRepository.findByPriority(priority, pageable);
        } else {
            complaints = complaintRepository.findAll(pageable);
        }
        
        return complaints.map(this::convertToComplaintDto);
    }
    
    /**
     * Get complaint by ID
     */
    public ComplaintDto getComplaintById(Long id) {
        log.info("Fetching complaint by ID: {}", id);
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        return convertToComplaintDto(complaint);
    }
    
    /**
     * Update complaint status
     */
    @Transactional
    public ComplaintDto updateComplaintStatus(Long id, helpstatus status, String adminUsername) {
        log.info("Updating complaint {} status to {}", id, status);
        
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        
        complaint.setStatus(status);
        
        if (status == helpstatus.RESOLVED) {
            complaint.setActualResolutionDate(LocalDateTime.now());
        }
        
        Complaint updated = complaintRepository.save(complaint);
        return convertToComplaintDto(updated);
    }
    
    /**
     * Update complaint priority
     */
    @Transactional
    public ComplaintDto updateComplaintPriority(Long id, Priority priority) {
        log.info("Updating complaint {} priority to {}", id, priority);
        
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        
        complaint.setPriority(priority);
        Complaint updated = complaintRepository.save(complaint);
        return convertToComplaintDto(updated);
    }
    
    /**
     * Add resolution to complaint
     */
    @Transactional
    public ComplaintDto addResolution(Long id, String resolution, String adminUsername) {
        log.info("Adding resolution to complaint {}", id);
        
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        
        // Note: Complaint model doesn't have resolution field, just mark as resolved
        complaint.setStatus(helpstatus.RESOLVED);
        complaint.setActualResolutionDate(LocalDateTime.now());
        
        Complaint updated = complaintRepository.save(complaint);
        return convertToComplaintDto(updated);
    }
    
    /**
     * Get complaints statistics
     */
    public ComplaintStatistics getComplaintStatistics() {
        log.info("Fetching complaint statistics");
        
        List<Complaint> allComplaints = complaintRepository.findAll();
        
        long total = allComplaints.size();
        long pending = allComplaints.stream()
                .filter(c -> c.getStatus() == helpstatus.OPEN || 
                            c.getStatus() == helpstatus.IN_PROGRESS)
                .count();
        long resolved = allComplaints.stream()
                .filter(c -> c.getStatus() == helpstatus.RESOLVED)
                .count();
        long closed = allComplaints.stream()
                .filter(c -> c.getStatus() == helpstatus.CLOSED)
                .count();
        long highPriority = allComplaints.stream()
                .filter(c -> c.getPriority() == Priority.HIGH ||
                            c.getPriority() == Priority.URGENT)
                .count();
        
        return new ComplaintStatistics(total, pending, resolved, closed, highPriority);
    }
    
    /**
     * Convert Complaint to DTO
     */
    private ComplaintDto convertToComplaintDto(Complaint complaint) {
        User user = null;
        if (complaint.getTenantId() != null) {
            user = userRepository.findById(complaint.getTenantId()).orElse(null);
        } else if (complaint.getOwnerId() != null) {
            user = userRepository.findById(complaint.getOwnerId()).orElse(null);
        }
        
        Property property = null;
        if (complaint.getPropertyId() != null) {
            property = propertyRepository.findById(complaint.getPropertyId()).orElse(null);
        }
        
        String propertyName = "N/A";
        if (property != null) {
            propertyName = property.getName() != null ? property.getName() : 
                          (property.getFlatNumber() != null ? "Flat " + property.getFlatNumber() : 
                          "Property #" + property.getId());
        }
        
        return ComplaintDto.builder()
                .id(complaint.getId())
                .complaintId(complaint.getComplaintId())
                .category(complaint.getCategory())
                .subject(complaint.getTitle())
                .description(complaint.getDescription())
                .status(complaint.getStatus())
                .priority(complaint.getPriority())
                .userId(complaint.getTenantId() != null ? complaint.getTenantId() : complaint.getOwnerId())
                .username(user != null ? user.getUsername() : "Unknown")
                .userEmail(user != null ? user.getEmail() : "N/A")
                .userPhone(user != null ? user.getPhoneNumber() : "N/A")
                .propertyId(complaint.getPropertyId())
                .propertyName(propertyName)
                .actualResolutionDate(complaint.getActualResolutionDate())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .totalMessages(0) // Placeholder
                .hasAttachments(complaint.getAttachmentUrl() != null && !complaint.getAttachmentUrl().isEmpty())
                .build();
    }
    
    /**
     * Inner class for complaint statistics
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ComplaintStatistics {
        private Long total;
        private Long pending;
        private Long resolved;
        private Long closed;
        private Long highPriority;
    }
}
