package com.Flatery.service;

import com.Flatery.dto.UserCountsDto;
import com.Flatery.model.RoleName;
import com.Flatery.repository.UserRepository;
import com.Flatery.repository.property.PropertyRepository;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public StatsService(PropertyRepository propertyRepository, UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns counts for owners and tenants.
     * - Owners: users with RoleName.ADMIN (property owners)
     * - Tenants: users with RoleName.USER (tenants)
     */
    public UserCountsDto getUserCounts() {
        long ownerCount = userRepository.countByRole(RoleName.ADMIN);
        long tenantCount = userRepository.countByRole(RoleName.USER);
        return new UserCountsDto(ownerCount, tenantCount);
    }
}
