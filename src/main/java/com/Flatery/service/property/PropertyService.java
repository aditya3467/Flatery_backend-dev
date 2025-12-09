package com.Flatery.service.property;

import com.Flatery.dto.property.CreatePropertyRequest;
import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.dto.property.UpdatePropertyRequest;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.service.property.mapper.PropertyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper mapper;
    private final PropertyImageService imageService; // can be a no-op for now
    private final com.Flatery.repository.tenant.TenantRepository tenantRepository;

    @Transactional
    public PropertyResponse create(CreatePropertyRequest req, Long ownerId) {
        validateCreate(req);
        Property entity = mapper.toEntity(req, ownerId);
        Property saved = propertyRepository.save(entity);
        String primary = imageService.getPrimaryImageUrl(saved.getId()); // returns null if none
        return mapper.toResponse(saved, primary);
    }

    @Transactional
    public PropertyResponse update(Long id, UpdatePropertyRequest req, Long actorUserId) {
        Property existing = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));

        enforceOwnershipOrSuperAdmin(existing, actorUserId);

        merge(existing, req);
        validateEntity(existing);

        Property saved = propertyRepository.save(existing);
        String primary = imageService.getPrimaryImageUrl(saved.getId());
        return mapper.toResponse(saved, primary);
    }

    @Transactional
    public PropertyResponse toggleStatus(Long id, Long actorUserId) {
        Property existing = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        enforceOwnershipOrSuperAdmin(existing, actorUserId);
        
        // Toggle between ACTIVE and INACTIVE
        existing.setStatus(existing.getStatus() == com.Flatery.model.property.enums.PropertyStatus.ACTIVE 
            ? com.Flatery.model.property.enums.PropertyStatus.INACTIVE 
            : com.Flatery.model.property.enums.PropertyStatus.ACTIVE);
        
        Property saved = propertyRepository.save(existing);
        String primary = imageService.getPrimaryImageUrl(saved.getId());
        return mapper.toResponse(saved, primary);
    }

    @Transactional
    public void delete(Long id, Long actorUserId) {
        Property existing = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        enforceOwnershipOrSuperAdmin(existing, actorUserId);
        propertyRepository.delete(existing);
        imageService.deleteAllForProperty(id); // optional
    }

    @Transactional(readOnly = true)
    public PropertyResponse getByIdForOwner(Long id, Long actorUserId) {
        Property prop = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        enforceOwnershipOrSuperAdmin(prop, actorUserId);
        String primary = imageService.getPrimaryImageUrl(prop.getId());
        return mapper.toResponse(prop, primary);
    }

    @Transactional(readOnly = true)
    public Page<PropertySummary> listForOwner(Long actorUserId, boolean allIfSuperAdmin, Pageable pageable) {
        if (allIfSuperAdmin && isSuperAdmin(actorUserId)) {
            Page<Property> page = propertyRepository.findAll(pageable);
            return page.map(p -> mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId())));
        }
        Page<Property> page = propertyRepository.findByOwnerId(actorUserId, pageable);
        return page.map(p -> mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId())));
    }

    @Transactional(readOnly = true)
    public Page<PropertySummary> listFlatPropertiesForOwner(Long actorUserId, Pageable pageable) {
        Page<Property> page = propertyRepository.findByOwnerIdAndType(actorUserId, PropertyType.FLAT, pageable);
        return page.map(p -> mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId())));
    }

    /**
     * Returns total active security deposits for an owner (all ongoing tenancies).
     */
    @Transactional(readOnly = true)
    public int getTotalActiveSecurityDeposits(Long ownerId) {
        // Use repository method to fetch all active tenants for this owner
        java.util.List<com.Flatery.model.tenant.Tenant> activeTenants = tenantRepository.findByOwnerIdAndStatus(ownerId, com.Flatery.model.tenant.Tenant.TenantStatus.ACTIVE);
        int sum = 0;
        System.out.println("DEBUG: Summing security deposits for ownerId=" + ownerId);
        for (com.Flatery.model.tenant.Tenant t : activeTenants) {
            System.out.println("Tenant: " + t.getTenantId() + ", Name: " + t.getTenantName() + ", Deposit: " + t.getSecurityDeposit());
            if (t.getSecurityDeposit() != null) {
                sum += t.getSecurityDeposit();
            }
        }
        System.out.println("DEBUG: Total security deposit sum=" + sum);
        return sum;
    }

    // ---------- validation and helpers ----------

    private void validateCreate(CreatePropertyRequest req) {
        if (req.getType() == PropertyType.PG) {
            if (req.getPgSeater() == null) throw new IllegalArgumentException("pgSeater required for PG");
            if (req.getBhkType() != null) throw new IllegalArgumentException("bhkType must be null for PG");
            if (req.getName() == null || req.getName().isBlank()) throw new IllegalArgumentException("name required for PG");
        } else {
            if (req.getBhkType() == null) throw new IllegalArgumentException("bhkType required for FLAT/APARTMENT");
            if (req.getType() == PropertyType.APARTMENT && (req.getName() == null || req.getName().isBlank()))
                throw new IllegalArgumentException("name required for APARTMENT");
            if (req.getPgSeater() != null) throw new IllegalArgumentException("pgSeater must be null for FLAT/APARTMENT");
        }
        if (req.getTotalFloor() < req.getCurrentFloor())
            throw new IllegalArgumentException("totalFloor must be >= currentFloor");
    }

    private void validateEntity(Property p) {
        if (p.getTotalFloor() < p.getCurrentFloor())
            throw new IllegalArgumentException("totalFloor must be >= currentFloor");
        if (!p.isAllDay() && p.getScheduleStart() != null && p.getScheduleEnd() != null
                && !p.getScheduleStart().isBefore(p.getScheduleEnd())) {
            throw new IllegalArgumentException("schedule startTime must be before endTime");
        }
    }

    private void merge(Property p, UpdatePropertyRequest r) {
        if (r.getType() != null) p.setType(r.getType());
        if (r.getName() != null) p.setName(r.getName());
        if (r.getBhkType() != null) p.setBhkType(r.getBhkType());
        if (r.getPgSeater() != null) p.setPgSeater(r.getPgSeater());
        if (r.getCurrentFloor() != null) p.setCurrentFloor(r.getCurrentFloor());
        if (r.getTotalFloor() != null) p.setTotalFloor(r.getTotalFloor());
        if (r.getAge() != null) p.setAge(r.getAge());
        if (r.getFacing() != null) p.setFacing(r.getFacing());
        if (r.getBuiltUpAreaSqft() != null) p.setBuiltUpAreaSqft(r.getBuiltUpAreaSqft());

        if (r.getLocality() != null) {
            if (r.getLocality().getCity() != null) p.setCity(r.getLocality().getCity());
            if (r.getLocality().getLocation() != null) p.setLocation(r.getLocality().getLocation());
            if (r.getLocality().getLandmark() != null) p.setLandmark(r.getLocality().getLandmark());
        }

        if (r.getRental() != null) {
            if (r.getRental().getExpectedRent() != null) p.setExpectedRent(r.getRental().getExpectedRent());
            if (r.getRental().getExpectedDeposit() != null) p.setExpectedDeposit(r.getRental().getExpectedDeposit());
            if (r.getRental().getNegotiable() != null) p.setNegotiable(r.getRental().getNegotiable());
            if (r.getRental().getMonthlyMaintenance() != null) p.setMonthlyMaintenance(r.getRental().getMonthlyMaintenance());
            if (r.getRental().getAvailableFrom() != null) p.setAvailableFrom(r.getRental().getAvailableFrom());
            if (r.getRental().getFurnishing() != null) p.setFurnishing(r.getRental().getFurnishing());
            if (r.getRental().getParking() != null) p.setParking(r.getRental().getParking());
            if (r.getRental().getDescription() != null) p.setDescription(r.getRental().getDescription());
            if (r.getRental().getPreferredTenants() != null) p.setPreferredTenants(r.getRental().getPreferredTenants());
        }

        if (r.getBathrooms() != null) p.setBathrooms(r.getBathrooms());
        if (r.getAmenities() != null) p.setAmenities(r.getAmenities());
        if (r.getBalcony() != null) p.setBalcony(r.getBalcony());

        if (r.getShowing() != null) {
            if (r.getShowing().getWhoShows() != null) {
                p.setWhoShows(r.getShowing().getWhoShows());
            }
            if (r.getShowing().getCurrentCondition() != null) {
                p.setCurrentCondition(r.getShowing().getCurrentCondition());
            }
        }


        if (r.getAvailability() != null) p.setScheduleAvailability(r.getAvailability());
        if (r.getAllDay() != null) p.setAllDay(r.getAllDay());
        if (r.getStartTime() != null) p.setScheduleStart(r.getStartTime());
        if (r.getEndTime() != null) p.setScheduleEnd(r.getEndTime());
    }

    private void enforceOwnershipOrSuperAdmin(Property p, Long actorUserId) {
        if (isSuperAdmin(actorUserId)) return;
        if (!p.getOwnerId().equals(actorUserId)) {
            throw new SecurityException("Not allowed to modify this property");
        }
    }

    private boolean isSuperAdmin(Long actorUserId) {
        // Replace with a proper user service/authority check.
        // For now, return false and delegate role checks to Security annotations if needed.
        return false;
    }
}
