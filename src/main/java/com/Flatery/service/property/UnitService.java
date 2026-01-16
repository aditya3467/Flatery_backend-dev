package com.Flatery.service.property;

import com.Flatery.model.property.Floor;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.Unit;
import com.Flatery.model.property.enums.*;
import com.Flatery.dto.property.UnitOccupancyResponse;
import com.Flatery.repository.property.FloorRepository;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.property.UnitRepository;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final FloorRepository floorRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public Unit createUnit(Long propertyId, Long floorId, String code, UnitType type,
                          SharingType sharingType, Integer capacity, GenderPolicy genderPolicy,
                          Double rentAmount, Double depositAmount, Furnishing furnishedLevel,
                          String attributes, Long actorUserId) {
        
        // Verify property ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to modify this property");
        }

        // Verify floor belongs to property
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));
        
        if (!floor.getPropertyId().equals(propertyId)) {
            throw new IllegalArgumentException("Floor does not belong to this property");
        }

        // Check if unit code already exists on this floor
        if (unitRepository.existsByFloorIdAndCode(floorId, code)) {
            throw new IllegalArgumentException("Unit code already exists on this floor");
        }

        Unit unit = Unit.builder()
                .propertyId(propertyId)
                .floorId(floorId)
                .code(code)
                .type(type)
                .sharingType(sharingType)
                .capacity(capacity)
                .genderPolicy(genderPolicy)
                .rentAmount(rentAmount)
                .depositAmount(depositAmount)
                .status(UnitStatus.AVAILABLE)
                .furnishedLevel(furnishedLevel)
        .attributes(attributes)
                .build();

        return unitRepository.save(unit);
    }

    @Transactional(readOnly = true)
    public List<Unit> getUnitsForProperty(Long propertyId, Long actorUserId) {
        // Verify property ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to view this property");
        }

        return unitRepository.findByPropertyId(propertyId);
    }

    @Transactional(readOnly = true)
    public List<Unit> getUnitsForFloor(Long floorId, Long actorUserId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));

        // Verify property ownership
        Property property = propertyRepository.findById(floor.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to view this property");
        }

        return unitRepository.findByFloorId(floorId);
    }

    @Transactional
    public Unit updateUnitStatus(Long unitId, UnitStatus status, Long actorUserId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found"));

        // Verify property ownership
        Property property = propertyRepository.findById(unit.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to modify this unit");
        }

        unit.setStatus(status);
        return unitRepository.save(unit);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void recomputeUnitStatus(Long unitId) {
        if (unitId == null) {
            return; // No unit assigned, nothing to recompute
        }
        
        Unit unit = unitRepository.findById(unitId).orElse(null);
        if (unit == null) {
            // Unit doesn't exist, log warning but don't fail the parent transaction
            System.err.println("Warning: Cannot recompute status for non-existent unit ID: " + unitId);
            return;
        }

        // Count active tenancies: status ACTIVE AND (lease end date null or strictly after today)
        java.time.LocalDate today = java.time.LocalDate.now();
        long activeCount = tenantRepository.findByUnitId(unitId).stream()
                .filter(t -> t.getStatus() == com.Flatery.model.tenant.Tenant.TenantStatus.ACTIVE)
                .filter(t -> t.getLeaseEndDate() == null || t.getLeaseEndDate().isAfter(today))
                .count();

        Integer capacity = unit.getCapacity() == null ? 1 : unit.getCapacity();
        if (activeCount == 0) {
            unit.setStatus(UnitStatus.AVAILABLE);
        } else if (activeCount < capacity) {
            unit.setStatus(UnitStatus.PARTIAL);
        } else {
            unit.setStatus(UnitStatus.OCCUPIED);
        }

        unitRepository.save(unit);
        unitRepository.flush();
    }

    @Transactional
    public void recomputeAllForProperty(Long propertyId, Long actorUserId) {
        // Verify property ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));

        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to view this property");
        }

        List<Unit> units = unitRepository.findByPropertyId(propertyId);
        java.time.LocalDate today = java.time.LocalDate.now();
        for (Unit u : units) {
            long activeCount = tenantRepository.findByUnitId(u.getId()).stream()
                    .filter(t -> t.getStatus() == com.Flatery.model.tenant.Tenant.TenantStatus.ACTIVE)
                    .filter(t -> t.getLeaseEndDate() == null || t.getLeaseEndDate().isAfter(today))
                    .count();
            int capacity = u.getCapacity() == null ? 1 : u.getCapacity();
            if (activeCount == 0) {
                u.setStatus(UnitStatus.AVAILABLE);
            } else if (activeCount < capacity) {
                u.setStatus(UnitStatus.PARTIAL);
            } else {
                u.setStatus(UnitStatus.OCCUPIED);
            }
            unitRepository.save(u);
        }
        unitRepository.flush();
    }

    @Transactional(readOnly = true)
    public UnitOccupancyResponse getUnitOccupancy(Long unitId, Long actorUserId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found"));

        // Verify property ownership
        Property property = propertyRepository.findById(unit.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to view this unit");
        }

        var tenants = tenantRepository.findByUnitId(unitId);
        java.time.LocalDate today = java.time.LocalDate.now();
        long activeCount = tenants.stream()
                .filter(t -> t.getStatus() == com.Flatery.model.tenant.Tenant.TenantStatus.ACTIVE)
                .filter(t -> t.getLeaseEndDate() == null || t.getLeaseEndDate().isAfter(today))
                .count();

        List<UnitOccupancyResponse.TenantBedInfo> list = tenants.stream()
                .map(t -> new UnitOccupancyResponse.TenantBedInfo(
                        t.getId(),
                        t.getTenantId(),
                        t.getTenantName(),
                        t.getBedIndex(),
                        t.getLeaseStartDate() != null ? t.getLeaseStartDate().toString() : null,
                        t.getLeaseEndDate() != null ? t.getLeaseEndDate().toString() : null,
                        t.getStatus() == com.Flatery.model.tenant.Tenant.TenantStatus.ACTIVE && (t.getLeaseEndDate() == null || t.getLeaseEndDate().isAfter(today))
                ))
                .toList();

        return new UnitOccupancyResponse(
                unitId,
                unit.getCapacity() == null ? 1 : unit.getCapacity(),
                activeCount,
                tenants.size(),
                list
        );
    }

    @Transactional
    public void deleteUnit(Long unitId, Long actorUserId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new IllegalArgumentException("Unit not found"));

        // Verify property ownership
        Property property = propertyRepository.findById(unit.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        
        if (!property.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not authorized to modify this property");
        }

        // Check if unit has active tenants
        long activeCount = tenantRepository.countByUnitIdAndLeaseEndDateIsNull(unitId);
        if (activeCount > 0) {
            throw new IllegalStateException("Cannot delete unit with active tenants");
        }

        unitRepository.delete(unit);
    }
}
