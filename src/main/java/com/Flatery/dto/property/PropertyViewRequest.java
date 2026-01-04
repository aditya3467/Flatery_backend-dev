package com.Flatery.dto.property;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyViewRequest {
    private Long propertyId;
    private String sessionId; // For guest tracking
    private Integer viewDurationSeconds; // Optional
    private String referrer; // Where they came from
}
