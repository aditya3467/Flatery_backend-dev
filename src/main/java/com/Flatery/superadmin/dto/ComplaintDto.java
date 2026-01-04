package com.Flatery.superadmin.dto;

import com.Flatery.model.help.helpstatus;
import com.Flatery.model.help.Priority;
import com.Flatery.model.help.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for complaint management in SuperAdmin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintDto {
    private Long id;
    private String complaintId;
    private Category category;
    private String subject;
    private String description;
    private helpstatus status;
    private Priority priority;
    
    // User info
    private Long userId;
    private String username;
    private String userEmail;
    private String userPhone;
    
    // Property info (if applicable)
    private Long propertyId;
    private String propertyName;
    
    // Resolution
    private LocalDateTime actualResolutionDate;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Metadata
    private Integer totalMessages;
    private Boolean hasAttachments;
}
