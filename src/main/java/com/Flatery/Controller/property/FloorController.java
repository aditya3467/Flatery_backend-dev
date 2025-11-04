package com.Flatery.Controller.property;

import com.Flatery.dto.property.CreateFloorRequest;
import com.Flatery.dto.property.FloorResponse;
import com.Flatery.model.User;
import com.Flatery.model.property.Floor;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.property.FloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/properties")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
public class FloorController {

    private final FloorService floorService;
    private final UserRepository userRepository;

    @GetMapping("/{propertyId}/floors")
    public ResponseEntity<List<FloorResponse>> getFloors(
            @PathVariable Long propertyId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        List<Floor> floors = floorService.getFloorsForProperty(propertyId, userId);
        List<FloorResponse> response = floors.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{propertyId}/floors")
    public ResponseEntity<FloorResponse> createFloor(
            @PathVariable Long propertyId,
            @RequestBody CreateFloorRequest request,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        Floor floor = floorService.createFloor(
                propertyId,
                request.getNumber(),
                request.getName(),
                userId
        );
        return ResponseEntity.status(201).body(toResponse(floor));
    }

    @DeleteMapping("/floors/{floorId}")
    public ResponseEntity<Void> deleteFloor(
            @PathVariable Long floorId,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        floorService.deleteFloor(floorId, userId);
        return ResponseEntity.noContent().build();
    }

    private FloorResponse toResponse(Floor floor) {
        return FloorResponse.builder()
                .id(floor.getId())
                .propertyId(floor.getPropertyId())
                .number(floor.getNumber())
                .name(floor.getName())
                .sortIndex(floor.getSortIndex())
                .createdAt(floor.getCreatedAt())
                .updatedAt(floor.getUpdatedAt())
                .build();
    }

    private Long getUserId(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return user.getId();
    }
}
