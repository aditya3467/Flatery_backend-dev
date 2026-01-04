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
    
    // Find all tenants by contact info (for single active tenancy validation)
    List<Tenant> findAllByPhoneNumber(String phoneNumber);
    List<Tenant> findAllByEmailAddress(String email);
    
    // Unit-based queries
    long countByUnitIdAndLeaseEndDateIsNull(Long unitId);
    List<Tenant> findByUnitId(Long unitId);
    
    // Primary tenant queries
    List<Tenant> findByPropertyIdAndPrimary(Long propertyId, boolean primary);
    Optional<Tenant> findByPropertyIdAndPrimaryTrue(Long propertyId);

        // Sum of security deposits for all tenants of an owner
        @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.securityDeposit),0) FROM Tenant t WHERE t.ownerId = :ownerId AND t.status = 'ACTIVE'")
        Integer sumActiveSecurityDepositsByOwnerId(@org.springframework.data.repository.query.Param("ownerId") Long ownerId);
        
        // Count tenants by owner (for superadmin)
        long countByOwnerId(Long ownerId);
}
