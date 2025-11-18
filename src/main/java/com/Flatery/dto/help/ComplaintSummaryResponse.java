package com.Flatery.dto.help;

import com.Flatery.model.help.Category;
import com.Flatery.model.help.Priority;
import com.Flatery.model.help.helpstatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintSummaryResponse {

    private Long id;
    private String complaintId;
    private String title;
    private Category category;
    private Priority priority;
    private helpstatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime slaDeadline;
    private Boolean isSlaBreached;
}
