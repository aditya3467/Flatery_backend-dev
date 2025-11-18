package com.Flatery.dto.help;

import com.Flatery.model.help.helpstatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintUpdateStatusRequest {

    @NotNull(message = "New status is required")
    private helpstatus newStatus;

    private String message; // Optional owner response

    private String reason; // Optional reason for status change
}
