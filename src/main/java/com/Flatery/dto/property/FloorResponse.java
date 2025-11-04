package com.Flatery.dto.property;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorResponse {
    private Long id;
    private Long propertyId;
    private Integer number;
    private String name;
    private Integer sortIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
