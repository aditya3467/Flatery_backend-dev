package com.Flatery.Controller;

import com.Flatery.dto.UserCountsDto;
import com.Flatery.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats/users")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    /**
     * Returns { ownerCount, tenantCount }.
     * Accessible only to users with role SUPERADMIN.
     */
    @GetMapping("/counts")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<UserCountsDto> getUserCounts() {
        UserCountsDto dto = statsService.getUserCounts();
        return ResponseEntity.ok(dto);
    }
}
