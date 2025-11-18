package com.Flatery.dto.help;

import com.Flatery.model.help.ResponseType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintResponseDTO {

    private Long id;
    private Long responderId;
    private String message;
    private ResponseType responseType;
    private Boolean isOwnerResponse;
    private String attachmentUrl;
    private LocalDateTime respondedAt;
}