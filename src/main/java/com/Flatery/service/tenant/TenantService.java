package com.Flatery.service.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
import com.Flatery.dto.tenant.TenantPropertyDetails;
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.Floor;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
import com.Flatery.model.property.Unit;
import com.Flatery.repository.property.UnitRepository;
import com.Flatery.repository.property.FloorRepository;
import com.Flatery.service.property.UnitService;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UnitRepository unitRepository;
    private final FloorRepository floorRepository;
    private final UnitService unitService;

    private static final String TENANT_PREFIX = "TEN";
    private final Random random = new SecureRandom();

    @Transactional
    public TenantResponse addTenant(Long ownerId, AddTenantRequest req) {
        // Validate property belongs to owner
        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        if (!property.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this property");
        }

    // Create tenant entity
    Tenant tenant = new Tenant();
    tenant.setTenantId(generateTenantId());
    tenant.setOwnerId(ownerId);
    tenant.setPropertyId(property.getId());
    tenant.setTenantName(req.getTenantName().trim());
    tenant.setPhoneNumber(req.getPhoneNumber());
    tenant.setEmailAddress(req.getEmailAddress());
    tenant.setFlatRoomNumber(req.getFlatRoomNumber());
    tenant.setRentAmount(req.getRentAmount());
    tenant.setSecurityDeposit(req.getSecurityDeposit());
    tenant.setRentDueDate(req.getRentDueDate());
    tenant.setLeaseStartDate(java.time.LocalDate.parse(req.getLeaseStartDate()));
    if (req.getLeaseEndDate() != null && !req.getLeaseEndDate().isBlank()) {
        tenant.setLeaseEndDate(java.time.LocalDate.parse(req.getLeaseEndDate()));
    }
    Tenant.TenantStatus status = parseStatusOrDefault(req.getStatus());
    tenant.setStatus(status);

    // Optional: Assign to PG unit
    if (req.getUnitId() != null) {
        Unit unit = unitRepository.findById(req.getUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Unit not found"));

        // Validate unit belongs to the same property
        if (!unit.getPropertyId().equals(property.getId())) {
            throw new IllegalArgumentException("Unit does not belong to the selected property");
        }

        // Validate owner owns the property of the unit (already verified via property above)

        // Determine currently occupied beds (active tenancies with bed index)
        var activeTenants = tenantRepository.findByUnitId(unit.getId()).stream()
                .filter(t -> t.getLeaseEndDate() == null)
                .toList();

        // Compute bed assignment
        Integer requestedBed = req.getBedIndex();
        int capacity = unit.getCapacity() != null ? unit.getCapacity() : 1;
        if (requestedBed != null) {
            if (requestedBed < 1 || requestedBed > capacity) {
                throw new IllegalArgumentException("Bed index must be between 1 and " + capacity);
            }
            boolean taken = activeTenants.stream()
                    .anyMatch(t -> t.getBedIndex() != null && t.getBedIndex().equals(requestedBed));
            if (taken) {
                throw new IllegalArgumentException("Selected bed is already occupied");
            }
            tenant.setBedIndex(requestedBed);
        } else {
            // Auto-assign the first free bed
            java.util.Set<Integer> occupied = activeTenants.stream()
                    .map(Tenant::getBedIndex)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
            Integer free = null;
            for (int i = 1; i <= capacity; i++) {
                if (!occupied.contains(i)) { free = i; break; }
            }
            if (free == null) {
                throw new IllegalArgumentException("No free beds available in this unit");
            }
            tenant.setBedIndex(free);
        }
        tenant.setUnitId(unit.getId());
        tenant.setFloorId(unit.getFloorId());
    }

    // Check if user already exists by phone or email
    User existing = null;
    if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
        existing = userRepository.findByPhoneNumber(req.getPhoneNumber().trim()).orElse(null);
    }
    if (existing == null && req.getEmailAddress() != null && !req.getEmailAddress().isBlank()) {
        existing = userRepository.findByEmail(req.getEmailAddress().trim()).orElse(null);
    }

    String username;
    String rawPassword = null;
    if (existing != null) {
        // Link to existing user account: do not create temp password
        tenant.setTemporaryPassword(null);
        tenant.setPasswordChanged(true);
        username = existing.getUsername();
    } else {
        // Create a new user with a temporary password
        rawPassword = (req.getTemporaryPassword() != null && !req.getTemporaryPassword().isBlank())
                ? req.getTemporaryPassword()
                : generateTemporaryPassword();
        tenant.setTemporaryPassword(rawPassword);
        tenant.setPasswordChanged(false);
        username = (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank())
                ? req.getPhoneNumber()
                : tenant.getTenantId().toLowerCase(Locale.ROOT);
    }

    tenant = tenantRepository.save(tenant);

    // If assigned to a unit, recompute its occupancy status
    if (tenant.getUnitId() != null) {
        unitService.recomputeUnitStatus(tenant.getUnitId());
    }

    if (existing == null) {
        User user = new User();
        user.setFirstName(req.getTenantName());
        user.setLastName("");
        user.setUsername(username.toLowerCase(Locale.ROOT));
        // Use provided email or synthetic to satisfy unique + not null
        String email = (req.getEmailAddress() != null && !req.getEmailAddress().isBlank())
                ? req.getEmailAddress()
                : (tenant.getTenantId().toLowerCase(Locale.ROOT) + "@tenant.local");
        user.setEmail(email);
        user.setPhoneNumber(req.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRoles(Set.of(RoleName.USER));
        userRepository.save(user);
    }

    // Build response
    TenantResponse response = TenantResponse.of(tenant);
    response.setUsername(username);
    response.setTemporaryPassword(rawPassword); // null when existing user
        return response;
    }

    @Transactional(readOnly = true)
    public List<TenantSummary> getOwnerTenants(Long ownerId) {
        return tenantRepository.findByOwnerId(ownerId).stream()
                .map(t -> new TenantSummary(
            t.getId(), t.getTenantId(), t.getTenantName(), t.getStatus().name(), 
            t.getRentAmount(), t.getSecurityDeposit(), t.getRentDueDate(), t.getPropertyId(), t.getPhoneNumber(),
            t.getFloorId(), t.getUnitId(), t.getBedIndex(),
            t.getLeaseStartDate() != null ? t.getLeaseStartDate().toString() : null,
            t.getEmailAddress(),
            t.getFlatRoomNumber(),
            null, null, null, null  // ownerName, ownerPhone, propertyName, propertyCity not needed
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TenantSummary> getTenantsByUnit(Long unitId) {
    return tenantRepository.findByUnitId(unitId).stream()
        .map(t -> new TenantSummary(
            t.getId(), t.getTenantId(), t.getTenantName(), t.getStatus().name(),
            t.getRentAmount(), t.getSecurityDeposit(), t.getRentDueDate(), t.getPropertyId(), t.getPhoneNumber(),
            t.getFloorId(), t.getUnitId(), t.getBedIndex(),
            t.getLeaseStartDate() != null ? t.getLeaseStartDate().toString() : null,
            t.getEmailAddress(),
            t.getFlatRoomNumber(),
            null, null, null, null  // ownerName, ownerPhone, propertyName, propertyCity not needed
        ))
        .collect(Collectors.toList());
    }

    private Tenant.TenantStatus parseStatusOrDefault(String status) {
        if (status == null || status.isBlank()) {
            return Tenant.TenantStatus.ACTIVE;
        }
        try {
            return Tenant.TenantStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Tenant.TenantStatus.ACTIVE;
        }
    }

    /**
     * Get current tenant's information by username (phone number)
     */
    public TenantSummary getCurrentTenantInfo(String username) {
        // Step 1: Get active tenancy info
        Tenant tenant = tenantRepository.findByPhoneNumber(username)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found for user: " + username));
        
        // Step 2: Get owner details from ownerId in tenancy
        User owner = null;
        String ownerName = null;
        String ownerPhone = null;
        if (tenant.getOwnerId() != null) {
            owner = userRepository.findById(tenant.getOwnerId()).orElse(null);
            if (owner != null) {
                ownerName = owner.getFirstName() + " " + owner.getLastName();
                ownerPhone = owner.getUsername(); // username is the phone number
            }
        }
        
        // Step 3: Get property details
        Property property = null;
        String propertyName = null;
        String propertyCity = null;
        if (tenant.getPropertyId() != null) {
            property = propertyRepository.findById(tenant.getPropertyId()).orElse(null);
            if (property != null) {
                propertyName = property.getName();
                propertyCity = property.getCity();
            }
        }
        
        return new TenantSummary(
                tenant.getId(),
                tenant.getTenantId(),
                tenant.getTenantName(),
                tenant.getStatus().name(),
                tenant.getRentAmount(),
                tenant.getSecurityDeposit(),
                tenant.getRentDueDate(),
                tenant.getPropertyId(),
                tenant.getPhoneNumber(),
                tenant.getFloorId(),
                tenant.getUnitId(),
                tenant.getBedIndex(),
                tenant.getLeaseStartDate() != null ? tenant.getLeaseStartDate().toString() : null,
                tenant.getEmailAddress(),
                tenant.getFlatRoomNumber(),
                ownerName,
                ownerPhone,
                propertyName,
                propertyCity
        );
    }

    /**
     * Get unit details for current tenant
     */
    public Unit getTenantUnit(String username) {
        Tenant tenant = tenantRepository.findByPhoneNumber(username)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found for user: " + username));
        
        if (tenant.getUnitId() == null) {
            throw new IllegalArgumentException("Tenant does not have a unit assigned");
        }
        
        return unitRepository.findById(tenant.getUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Unit not found"));
    }

    /**
     * Get comprehensive property details for current tenant
     * This includes property info, unit details, owner info, amenities, and rules
     */
    public TenantPropertyDetails getTenantPropertyDetails(String username) {
        Tenant tenant = tenantRepository.findByPhoneNumber(username)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found for user: " + username));

        // Get property information
        Property property = propertyRepository.findById(tenant.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));

        // Get unit information
        Unit unit = null;
        if (tenant.getUnitId() != null) {
            unit = unitRepository.findById(tenant.getUnitId()).orElse(null);
        }

        // Get floor information
        Floor floor = null;
        if (tenant.getFloorId() != null) {
            floor = floorRepository.findById(tenant.getFloorId()).orElse(null);
        }

        // Get owner information
        User owner = userRepository.findById(property.getOwnerId())
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));

        // Create and populate the response DTO
        TenantPropertyDetails details = new TenantPropertyDetails();
        
        // Property information
        details.setPropertyId(property.getId());
        details.setPropertyName(property.getName());
        // Combine location and landmark for address
        String address = property.getLocation();
        if (property.getLandmark() != null && !property.getLandmark().isEmpty()) {
            address += ", " + property.getLandmark();
        }
        details.setAddress(address);
        details.setCity(property.getCity());
        details.setState(null); // No state field in Property model
        details.setPropertyType(property.getType() != null ? property.getType().toString() : "PG");
        details.setTotalFloors(property.getTotalFloor()); // Using totalFloor field
        details.setDescription(property.getDescription());

        // Unit information
        if (unit != null) {
            details.setUnitId(unit.getId());
            details.setUnitCode(unit.getCode());
            details.setUnitType(unit.getType() != null ? unit.getType().toString() : null);
            details.setCapacity(unit.getCapacity());
            details.setStatus(unit.getStatus() != null ? unit.getStatus().toString() : null);
        }

        // Floor information
        if (floor != null) {
            details.setFloorId(floor.getId());
            details.setFloorName(floor.getName());
            details.setFloorNumber(floor.getNumber());
        }

        // Owner information
        details.setOwnerId(owner.getId());
        details.setOwnerName(owner.getFirstName() + " " + owner.getLastName()); // Combining first and last name
        details.setOwnerPhone(owner.getPhoneNumber());
        details.setOwnerEmail(owner.getEmail());

        // Tenant-specific information
        details.setRentAmount(tenant.getRentAmount());
        details.setSecurityDeposit(tenant.getSecurityDeposit());
        details.setRentDueDate(tenant.getRentDueDate());
        details.setLeaseStartDate(tenant.getLeaseStartDate() != null ? tenant.getLeaseStartDate().toString() : null);
        details.setLeaseEndDate(tenant.getLeaseEndDate() != null ? tenant.getLeaseEndDate().toString() : null);
        details.setTenantStatus(tenant.getStatus() != null ? tenant.getStatus().toString() : "ACTIVE");

        // Default amenities (TODO: implement proper amenities table and repository)
        List<TenantPropertyDetails.AmenityDto> amenities = new ArrayList<>();
        amenities.add(new TenantPropertyDetails.AmenityDto(1L, "WiFi", "High-speed internet", "fas fa-wifi"));
        amenities.add(new TenantPropertyDetails.AmenityDto(2L, "Laundry", "Washing machine available", "fas fa-tshirt"));
        amenities.add(new TenantPropertyDetails.AmenityDto(3L, "Kitchen", "Shared kitchen facility", "fas fa-utensils"));
        amenities.add(new TenantPropertyDetails.AmenityDto(4L, "Hot Water", "24/7 hot water supply", "fas fa-shower"));
        amenities.add(new TenantPropertyDetails.AmenityDto(5L, "Daily Cleaning", "Room cleaning service", "fas fa-broom"));
        details.setAmenities(amenities);

        // Default rules (TODO: implement proper rules table)
        List<String> rules = new ArrayList<>();
        rules.add("Visitors not allowed after 8 PM");
        rules.add("Quiet hours: 10 PM – 6 AM");
        rules.add("No smoking or alcohol in rooms");
        rules.add("Maintain cleanliness");
        rules.add("Respect other residents");
        details.setRules(rules);

        return details;
    }

    private String generateTenantId() {
        // TEN + 5 digits
        String id;
        do {
            id = TENANT_PREFIX + String.format("%05d", random.nextInt(100000));
        } while (tenantRepository.existsByTenantId(id));
        return id;
    }

    private String generateTemporaryPassword() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Deactivate a tenant by external tenantId (TENxxxxx):
     * - Validate ownership
     * - Mark status VACATED
     * - Set leaseEndDate to today (ensures not counted as active)
     * - Clear bedIndex to free the bed
     * - Recompute unit occupancy if assigned
     * Returns updated TenantSummary
     */
    @Transactional
    public TenantSummary deactivateTenant(Long ownerId, String externalTenantId) {
        Tenant tenant = tenantRepository.findByTenantId(externalTenantId)
                .orElseGet(() -> {
                    try {
                        Long internalId = Long.parseLong(externalTenantId);
                        return tenantRepository.findById(internalId).orElse(null);
                    } catch (NumberFormatException nfe) {
                        return null;
                    }
                });
        if (tenant == null) {
            throw new IllegalArgumentException("Tenant not found");
        }

        if (!tenant.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("You do not have permission to modify this tenant");
        }

        // Update status and dates; set lease end date to today (ensures not active) and clear bed assignment
        tenant.setStatus(Tenant.TenantStatus.VACATED);
        tenant.setLeaseEndDate(java.time.LocalDate.now()); // even if already set, override to today to guarantee vacancy
        tenant.setBedIndex(null); // free the bed explicitly

        tenantRepository.save(tenant);

        // Update unit occupancy if applicable
        if (tenant.getUnitId() != null) {
            unitService.recomputeUnitStatus(tenant.getUnitId());
        }

        return new TenantSummary(
                tenant.getId(),
                tenant.getTenantId(),
                tenant.getTenantName(),
                tenant.getStatus().name(),
                tenant.getRentAmount(),
                tenant.getSecurityDeposit(),
                tenant.getRentDueDate(),
                tenant.getPropertyId(),
                tenant.getPhoneNumber(),
                tenant.getFloorId(),
                tenant.getUnitId(),
                tenant.getBedIndex(),
                tenant.getLeaseStartDate() != null ? tenant.getLeaseStartDate().toString() : null,
                tenant.getEmailAddress(),
                tenant.getFlatRoomNumber(),
                null, null, null, null
        );
    }

    // ...existing code...
}
