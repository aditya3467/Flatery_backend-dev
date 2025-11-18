package com.Flatery.dto.help;

import com.Flatery.model.help.Category;
import com.Flatery.model.help.Priority;
import com.Flatery.model.help.helpstatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintDetailResponse {

    private Long id;
    private String complaintId;
    private Long tenantId;
    private Long ownerId;
    private Long propertyId;
    private Category category;
    private String title;
    private String description;
    private Priority priority;
    private helpstatus status;
    private String attachmentUrl;
    private LocalDate preferredResolutionDate;
    private LocalDateTime slaDeadline;
    private Boolean isSlaBreached;
    private LocalDateTime actualResolutionDate;
    private Integer reopenCount;
    private LocalDateTime submittedAt;

    // Additional data
    private List<ComplaintResponseDTO> responses;
    private List<ComplaintTimelineDTO> timeline;
}
