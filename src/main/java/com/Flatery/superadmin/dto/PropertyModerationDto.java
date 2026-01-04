package com.Flatery.superadmin.dto;

import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.property.enums.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Property moderation in SuperAdmin panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyModerationDto {
    private Long id;
    private String title;
    private PropertyType type;
    private PropertyStatus status;
    private String address;
    private String city;
    private String state;
    private Double monthlyRent;
    
    // Owner info
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    
    // Property details
    private Integer availableRooms;
    private Integer totalFloors;
    private Boolean verified;
    private LocalDateTime postedOn;
    private LocalDateTime lastModified;
    
    // Statistics
    private Long totalViews;
    private Long enquiries;
    
    // Images
    private String primaryImageUrl;
    private Integer totalImages;
}
