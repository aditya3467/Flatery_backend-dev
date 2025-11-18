package com.Flatery.repository.payment;

import com.Flatery.model.payment.TenantMonthlyPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantMonthlyPaymentStatusRepository extends JpaRepository<TenantMonthlyPaymentStatus, Long> {
    
    Optional<TenantMonthlyPaymentStatus> findByTenantIdAndPaymentMonth(Long tenantId, String paymentMonth);
    
    List<TenantMonthlyPaymentStatus> findByPropertyIdAndPaymentMonth(Long propertyId, String paymentMonth);
    
    List<TenantMonthlyPaymentStatus> findByTenantId(Long tenantId);
    
    List<TenantMonthlyPaymentStatus> findByTenantIdAndIsPaid(Long tenantId, boolean isPaid);
    
    boolean existsByTenantIdAndPaymentMonth(Long tenantId, String paymentMonth);
}