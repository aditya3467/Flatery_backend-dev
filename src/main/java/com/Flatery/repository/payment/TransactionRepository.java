package com.Flatery.repository.payment;

import com.Flatery.model.payment.Transaction;
import com.Flatery.model.payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByTenantId(Long tenantId);

    List<Transaction> findByOwnerId(Long ownerId);

    List<Transaction> findByOwnerIdAndStatus(Long ownerId, PaymentStatus status);

    List<Transaction> findByTenantIdAndStatus(Long tenantId, PaymentStatus status);

    List<Transaction> findByPaymentMonthAndStatus(String paymentMonth, PaymentStatus status);

    boolean existsByTenantIdAndPaymentMonth(Long tenantId, String paymentMonth);
    
    List<Transaction> findByCreatedBy(String createdBy);
    
    List<Transaction> findByTenantIdAndPaymentMonth(Long tenantId, String paymentMonth);
}
