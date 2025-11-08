package com.Flatery.Tenant.repository;

import com.Flatery.Tenant.model.TenantProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantProfileRepository extends JpaRepository<TenantProfile, Long> {
    Optional<TenantProfile> findByTenantId(Long tenantId);
}
