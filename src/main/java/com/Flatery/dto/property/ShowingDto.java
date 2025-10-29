package com.Flatery.dto.property;

import com.Flatery.model.property.enums.CurrentCondition;
import com.Flatery.model.property.enums.WhoShows;
import lombok.Data;

@Data
public class ShowingDto {
    private WhoShows whoShows;
    private CurrentCondition currentCondition;
}
