package com.Flatery.superadmin.service;

import com.Flatery.model.User;
import com.Flatery.model.RoleName;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.tenant.TenantRepository;
import com.Flatery.superadmin.dto.OwnerDto;
import com.Flatery.superadmin.dto.OwnerListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing owners in SuperAdmin panel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OwnerManagementService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;

    /**
     * Get paginated list of all owners
     */
    @Transactional(readOnly = true)
    public OwnerListResponse getAllOwners(int page, int size, String sortBy, String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, sortBy != null ? sortBy : "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> ownerPage;
        if (search != null && !search.trim().isEmpty()) {
            ownerPage = userRepository.findByRoleAndSearch(RoleName.ADMIN, search.trim(), pageable);
        } else {
            ownerPage = userRepository.findByRole(RoleName.ADMIN, pageable);
        }
        
        List<OwnerDto> owners = ownerPage.getContent().stream()
                .map(this::convertToOwnerDto)
                .collect(Collectors.toList());
        
        return OwnerListResponse.builder()
                .owners(owners)
                .totalElements(ownerPage.getTotalElements())
                .totalPages(ownerPage.getTotalPages())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    /**
     * Get owner details by ID
     */
    @Transactional(readOnly = true)
    public OwnerDto getOwnerById(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        if (!owner.getRoles().contains(RoleName.ADMIN)) {
            throw new RuntimeException("User is not an owner");
        }
        
        return convertToOwnerDto(owner);
    }

    /**
     * Convert User entity to OwnerDto with statistics
     */
    private OwnerDto convertToOwnerDto(User user) {
        Long totalProperties = propertyRepository.countByOwnerId(user.getId());
        Long activeTenants = tenantRepository.countByOwnerId(user.getId());
        
        return OwnerDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalProperties(totalProperties)
                .activeProperties(totalProperties) // Simplified - could be refined
                .totalTenants(activeTenants)
                .activeTenants(activeTenants)
                .isActive(true) // Simplified
                .isVerified(true) // Simplified
                .build();
    }
}
