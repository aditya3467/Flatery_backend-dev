package com.Flatery.dto.help;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintReopenRequest {

    @NotBlank(message = "Reason for reopening is required")
    @Size(min = 10, max = 300, message = "Reason must be between 10 and 300 characters")
    private String reason;
}
