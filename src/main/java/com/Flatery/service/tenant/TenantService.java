package com.Flatery.service.tenant;

import com.Flatery.dto.tenant.AddTenantRequest;
import com.Flatery.dto.tenant.TenantResponse;
import com.Flatery.dto.tenant.TenantSummary;
import com.Flatery.model.RoleName;
import com.Flatery.model.User;
import com.Flatery.model.property.Property;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.UserRepository;
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
                        t.getId(), t.getTenantId(), t.getTenantName(), t.getStatus().name(), t.getRentAmount(), t.getSecurityDeposit()
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
