package com.Flatery.service.tenant;

import com.Flatery.model.tenant.Tenant;
import com.Flatery.model.tenant.TenancyHistory;
import com.Flatery.repository.tenant.TenancyHistoryRepository;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenancyHistoryService {

    private final TenancyHistoryRepository tenancyHistoryRepository;
    private final TenantRepository tenantRepository;

    /**
     * Move tenant to history when vacated (simple case with just reason)
     */
    @Transactional
    public TenancyHistory vacateTenant(Long tenantId, String vacateReason) {
        return vacateTenant(tenantId, vacateReason, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    /**
     * Move tenant to history when vacated (with financial details)
     */
    @Transactional
    public TenancyHistory vacateTenant(Long tenantId, String vacateReason, 
                                     BigDecimal finalSettlement, BigDecimal depositReturned) {
        log.info("Vacating tenant with ID: {}", tenantId);
        
        // Find the active tenant
        Tenant activeTenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found with ID: " + tenantId));
        
        // Create tenancy history record
        TenancyHistory tenancyHistory = TenancyHistory.fromTenant(
                activeTenant, vacateReason);
        
        // Save to history
        TenancyHistory savedHistory = tenancyHistoryRepository.save(tenancyHistory);
        
        // Remove from active tenants
        tenantRepository.delete(activeTenant);
        
        log.info("Tenant {} moved to tenancy history successfully", activeTenant.getTenantName());
        return savedHistory;
    }

    /**
     * Get all tenancy history for a specific tenant by phone
     */
    public List<TenancyHistory> getTenantHistory(String phoneNumber) {
        return tenancyHistoryRepository.findByPhoneNumberOrderByTenancyEndDateDesc(phoneNumber);
    }

    /**
     * Get all tenancy history for a property
     */
    public List<TenancyHistory> getPropertyTenancyHistory(Long propertyId) {
        return tenancyHistoryRepository.findByPropertyIdOrderByTenancyEndDateDesc(propertyId);
    }

    /**
     * Get all tenancy history for an owner
     */
    public List<TenancyHistory> getOwnerTenancyHistory(Long ownerId) {
        return tenancyHistoryRepository.findByOwnerIdOrderByTenancyEndDateDesc(ownerId);
    }

    /**
     * Check if tenant can be re-admitted (no active tenancy)
     */
    public boolean canTenantBeReadmitted(String phoneNumber) {
        // Check if tenant has any active tenancy
        return !tenantRepository.findByPhoneNumber(phoneNumber).isPresent();
    }

    /**
     * Get tenant's previous tenancy count
     */
    public long getTenantTenancyCount(String phoneNumber) {
        return tenancyHistoryRepository.countByPhoneNumber(phoneNumber);
    }

    /**
     * Check if tenant has stayed at property before
     */
    public boolean hasStayedAtPropertyBefore(String phoneNumber, Long propertyId) {
        return tenancyHistoryRepository.existsByPhoneNumberAndPropertyId(phoneNumber, propertyId);
    }

    /**
     * Get tenant's latest tenancy information
     */
    public TenancyHistory getLatestTenancy(String phoneNumber) {
        return tenancyHistoryRepository.findLatestTenancyByPhoneNumber(phoneNumber);
    }
}