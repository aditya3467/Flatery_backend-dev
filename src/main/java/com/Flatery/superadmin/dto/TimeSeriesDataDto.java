package com.Flatery.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for time series chart data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSeriesDataDto {
    private String label;
    private List<LocalDate> dates;
    private List<Long> values;
    private String metric; // e.g., "users", "properties", "views"
}
