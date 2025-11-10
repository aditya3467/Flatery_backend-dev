package com.Flatery.dto.property;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFloorRequest {
    private Integer number;
    private String name;
}
