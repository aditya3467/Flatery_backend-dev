package com.Flatery.service.property;

import com.Flatery.model.property.Floor;
import com.Flatery.model.property.Property;
import com.Flatery.repository.property.FloorRepository;
import com.Flatery.repository.property.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FloorService {

    private final FloorRepository floorRepository;
    private final PropertyRepository propertyRepository;

    @Transactional
    public Floor createFloor(Long propertyId, Integer floorNumber, String floorName, Long actorUserId) {
        // Verify property ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to modify this property");
        }

        // Check if floor number already exists
        if (floorRepository.existsByPropertyIdAndNumber(propertyId, floorNumber)) {
            throw new IllegalArgumentException("Floor number already exists for this property");
        }

        Floor floor = Floor.builder()
                .propertyId(propertyId)
                .number(floorNumber)
                .name(floorName)
                .sortIndex(floorNumber)
                .build();

        return floorRepository.save(floor);
    }

    @Transactional(readOnly = true)
    public List<Floor> getFloorsForProperty(Long propertyId, Long actorUserId) {
        log.info("[GetFloors] Loading floors for propertyId={}, actorUserId={}", propertyId, actorUserId);
        
        // Verify property ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> {
                    log.error("[GetFloors] Property not found: {}", propertyId);
                    return new IllegalArgumentException("Property not found");
                });
        
        log.info("[GetFloors] Property found. OwnerId={}, ActorUserId={}", property.getOwnerId(), actorUserId);
        
        if (!property.getOwnerId().equals(actorUserId)) {
            log.error("[GetFloors] Authorization failed. Property owner {} != actor {}", property.getOwnerId(), actorUserId);
            throw new SecurityException("Not authorized to view this property");
        }

        List<Floor> floors = floorRepository.findByPropertyIdOrderByNumberAsc(propertyId);
        log.info("[GetFloors] Found {} floors for property {}", floors.size(), propertyId);
        return floors;
    }

    @Transactional
    public void deleteFloor(Long floorId, Long actorUserId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));

        // Verify property ownership
        Property property = propertyRepository.findById(floor.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to modify this property");
        }

        // Note: ON DELETE CASCADE will remove associated units
        floorRepository.delete(floor);
    }
}
