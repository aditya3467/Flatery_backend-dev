package com.Flatery.repository.tenant;

import com.Flatery.model.tenant.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    List<Tenant> findByOwnerIdAndStatus(Long ownerId, com.Flatery.model.tenant.Tenant.TenantStatus status);
    Optional<Tenant> findByTenantId(String tenantId);
    List<Tenant> findByOwnerId(Long ownerId);
    List<Tenant> findByPropertyId(Long propertyId);
    boolean existsByTenantId(String tenantId);
    Optional<Tenant> findByPhoneNumber(String phoneNumber);
    Optional<Tenant> findByEmailAddress(String email);
    List<Tenant> findAllByPhoneNumber(String phoneNumber);
    
    // Unit-based queries
    long countByUnitIdAndLeaseEndDateIsNull(Long unitId);
    List<Tenant> findByUnitId(Long unitId);

        // Sum of security deposits for all tenants of an owner
        @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.securityDeposit),0) FROM Tenant t WHERE t.ownerId = :ownerId AND t.status = 'ACTIVE'")
        Integer sumActiveSecurityDepositsByOwnerId(@org.springframework.data.repository.query.Param("ownerId") Long ownerId);
}

