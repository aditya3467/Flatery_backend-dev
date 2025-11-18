package com.Flatery.dto.help;

import com.Flatery.model.help.ResponseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintResponseRequest {

    @NotBlank(message = "Message is required")
    @Size(min = 5, max = 500, message = "Message must be between 5 and 500 characters")
    private String message;

    @NotNull(message = "Response type is required")
    private ResponseType responseType;
}
