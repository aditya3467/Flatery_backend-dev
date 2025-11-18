package com.Flatery.dto.help;

import com.Flatery.model.help.helpstatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintTimelineDTO {

    private helpstatus status;
    private LocalDateTime changedAt;
    private Long changedBy;
    private String reason;
}