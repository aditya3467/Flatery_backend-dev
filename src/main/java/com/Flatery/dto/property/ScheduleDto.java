package com.Flatery.dto.property;

import com.Flatery.model.property.enums.Availability;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ScheduleDto {
    private Availability availability;  // EVERYDAY, WEEKDAYS, WEEKEND
    private LocalTime startTime;        // ignored if allDay == true
    private LocalTime endTime;
    private Boolean allDay;             // default false in service if null
}
