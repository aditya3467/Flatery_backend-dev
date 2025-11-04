package com.Flatery.repository.tenant;

import com.Flatery.model.tenant.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByTenantId(String tenantId);
    List<Tenant> findByOwnerId(Long ownerId);
    List<Tenant> findByPropertyId(Long propertyId);
    boolean existsByTenantId(String tenantId);
    Optional<Tenant> findByPhoneNumber(String phoneNumber);
    Optional<Tenant> findByEmailAddress(String email);
}
