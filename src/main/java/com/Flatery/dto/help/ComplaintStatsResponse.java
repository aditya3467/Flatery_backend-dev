package com.Flatery.dto.help;
import lombok.*;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintStatsResponse {

    private Integer totalComplaints;
    private Integer openComplaints;
    private Integer resolvedComplaints;
    private Double averageResolutionTimeHours;
}