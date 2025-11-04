package com.Flatery.service.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.model.property.Property;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
import com.Flatery.model.property.Unit;
import com.Flatery.repository.property.UnitRepository;
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

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UnitRepository unitRepository;
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
            t.getRentAmount(), t.getSecurityDeposit(), t.getPropertyId(), t.getPhoneNumber(),
            t.getFloorId(), t.getUnitId(), t.getBedIndex()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TenantSummary> getTenantsByUnit(Long unitId) {
    return tenantRepository.findByUnitId(unitId).stream()
        .map(t -> new TenantSummary(
            t.getId(), t.getTenantId(), t.getTenantName(), t.getStatus().name(),
            t.getRentAmount(), t.getSecurityDeposit(), t.getPropertyId(), t.getPhoneNumber(),
            t.getFloorId(), t.getUnitId(), t.getBedIndex()
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
}
