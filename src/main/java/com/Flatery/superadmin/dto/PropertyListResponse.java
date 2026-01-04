package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated response for property list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyListResponse {
    private List<PropertyModerationDto> properties;
    private Long totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer pageSize;
}
