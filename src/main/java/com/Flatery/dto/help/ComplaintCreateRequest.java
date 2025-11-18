package com.Flatery.dto.help;

import com.Flatery.model.help.Category;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintCreateRequest {

    @NotNull(message = "Category is required")
    private Category category;

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 150, message = "Title must be between 5 and 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;

    private LocalDate preferredResolutionDate;
}
