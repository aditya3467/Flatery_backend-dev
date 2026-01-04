package com.Flatery.superadmin.controller;

import com.Flatery.model.help.Complaint;
import com.Flatery.model.help.helpstatus;
import com.Flatery.model.help.Priority;
import com.Flatery.superadmin.dto.ComplaintDto;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import com.Flatery.superadmin.service.ComplaintManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for SuperAdmin Complaint Management
 */
@RestController
@RequestMapping("/api/superadmin/complaints")
@RequiredArgsConstructor
@Slf4j
public class ComplaintManagementController {
    
    private final ComplaintManagementService complaintService;
    private final AuditLogService auditLogService;
    
    /**
     * Get all complaints with filters
     */
    @GetMapping
    public ResponseEntity<Page<ComplaintDto>> getAllComplaints(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) helpstatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching complaints", userDetails.getUsername());
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ComplaintDto> complaints = complaintService.getAllComplaints(
                status, priority, category, search, pageable
        );
        
        return ResponseEntity.ok(complaints);
    }
    
    /**
     * Get complaint by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintDto> getComplaintById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching complaint ID: {}", userDetails.getUsername(), id);
        
        ComplaintDto complaint = complaintService.getComplaintById(id);
        return ResponseEntity.ok(complaint);
    }
    
    /**
     * Update complaint status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintDto> updateComplaintStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam helpstatus status
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} updating complaint {} status to {}", 
                userDetails.getUsername(), id, status);
        
        ComplaintDto updated = complaintService.updateComplaintStatus(
                id, status, userDetails.getUsername()
        );
        
        auditLogService.log(
                userDetails.getUsername(),
                "UPDATE_COMPLAINT_STATUS",
                "Complaint",
                id,
                "Updated complaint status to " + status
        );
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Update complaint priority
     */
    @PutMapping("/{id}/priority")
    public ResponseEntity<ComplaintDto> updateComplaintPriority(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam Priority priority
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} updating complaint {} priority to {}", 
                userDetails.getUsername(), id, priority);
        
        ComplaintDto updated = complaintService.updateComplaintPriority(id, priority);
        
        auditLogService.log(
                userDetails.getUsername(),
                "UPDATE_COMPLAINT_PRIORITY",
                "Complaint",
                id,
                "Updated complaint priority to " + priority
        );
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Add resolution to complaint
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<ComplaintDto> addResolution(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody String resolution
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} adding resolution to complaint {}", 
                userDetails.getUsername(), id);
        
        ComplaintDto updated = complaintService.addResolution(
                id, resolution, userDetails.getUsername()
        );
        
        auditLogService.log(
                userDetails.getUsername(),
                "RESOLVE_COMPLAINT",
                "Complaint",
                id,
                "Added resolution to complaint"
        );
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Get complaint statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<ComplaintManagementService.ComplaintStatistics> getStatistics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching complaint statistics", userDetails.getUsername());
        
        ComplaintManagementService.ComplaintStatistics stats = complaintService.getComplaintStatistics();
        return ResponseEntity.ok(stats);
    }
}
