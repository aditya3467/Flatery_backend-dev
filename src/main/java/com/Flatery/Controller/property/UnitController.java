package com.Flatery.Controller.property;

import com.Flatery.dto.property.CreateUnitRequest;
import com.Flatery.dto.property.UnitResponse;
import com.Flatery.dto.property.UnitOccupancyResponse;
import com.Flatery.model.User;
import com.Flatery.model.property.Unit;
import com.Flatery.model.property.enums.UnitStatus;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.property.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/properties")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
public class UnitController {

    private final UnitService unitService;
    private final UserRepository userRepository;

    @GetMapping("/{propertyId}/units")
    public ResponseEntity<List<UnitResponse>> getUnits(
            @PathVariable Long propertyId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        // Ensure statuses are up to date based on active tenancies
        unitService.recomputeAllForProperty(propertyId, userId);
        List<Unit> units = unitService.getUnitsForProperty(propertyId, userId);
        List<UnitResponse> response = units.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{propertyId}/units")
    public ResponseEntity<UnitResponse> createUnit(
            @PathVariable Long propertyId,
            @RequestBody CreateUnitRequest request,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        Unit unit = unitService.createUnit(
                propertyId,
                request.getFloorId(),
                request.getCode(),
                request.getType(),
                request.getSharingType(),
                request.getCapacity(),
                request.getGenderPolicy(),
                request.getRentAmount(),
                request.getDepositAmount(),
                request.getFurnishedLevel(),
                request.getAttributes(),
                userId
        );
        return ResponseEntity.status(201).body(toResponse(unit));
    }

    @PatchMapping("/units/{unitId}")
    public ResponseEntity<UnitResponse> updateUnitStatus(
            @PathVariable Long unitId,
            @RequestBody Map<String, String> payload,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        String statusStr = payload.get("status");
        UnitStatus status = UnitStatus.valueOf(statusStr);
        Unit unit = unitService.updateUnitStatus(unitId, status, userId);
        return ResponseEntity.ok(toResponse(unit));
    }

    @DeleteMapping("/units/{unitId}")
    public ResponseEntity<Void> deleteUnit(
            @PathVariable Long unitId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        unitService.deleteUnit(unitId, userId);
        return ResponseEntity.noContent().build();
    }

        // Occupancy report for a unit (helps verify dashboard state)
        @GetMapping("/units/{unitId}/occupancy")
        public ResponseEntity<UnitOccupancyResponse> getUnitOccupancy(
                        @PathVariable Long unitId,
                        Authentication auth
        ) {
                Long userId = getUserId(auth);
                // Ensure status is up-to-date first
                unitService.recomputeUnitStatus(unitId);
                return ResponseEntity.ok(unitService.getUnitOccupancy(unitId, userId));
        }

        private UnitResponse toResponse(Unit unit) {
                // Compute occupancy dynamically from tenancy (no DB column needed)
                long activeCount = unitService.getUnitOccupancy(unit.getId(), getUserId(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication())).getActiveCount();
                return UnitResponse.builder()
                .id(unit.getId())
                .propertyId(unit.getPropertyId())
                .floorId(unit.getFloorId())
                .code(unit.getCode())
                .type(unit.getType())
                .sharingType(unit.getSharingType())
                .capacity(unit.getCapacity())
                                .occupiedBeds((int) activeCount)
                .genderPolicy(unit.getGenderPolicy())
                .rentAmount(unit.getRentAmount())
                .depositAmount(unit.getDepositAmount())
                .status(unit.getStatus())
                .furnishedLevel(unit.getFurnishedLevel())
                .attributes(unit.getAttributes())
                .createdAt(unit.getCreatedAt())
                .updatedAt(unit.getUpdatedAt())
                .build();
    }

    private Long getUserId(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return user.getId();
    }
}
