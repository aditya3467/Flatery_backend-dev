package com.Flatery.service.payment;

import com.Flatery.dto.payment.PaymentRequestDto;
import com.Flatery.dto.payment.TransactionResponseDto;
import com.Flatery.model.payment.PaymentMode;
import com.Flatery.model.payment.PaymentStatus;
import com.Flatery.model.payment.Transaction;
import com.Flatery.repository.payment.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    public Transaction save(Transaction transaction) {
        return repository.save(transaction);
    }

    public List<Transaction> findByTenantId(Long tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public List<Transaction> findByOwnerIdAndStatus(Long ownerId, PaymentStatus status) {
        return repository.findByOwnerIdAndStatus(ownerId, status);
    }

    public Optional<Transaction> findById(Long id) {
        return repository.findById(id);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * Create transaction for manual payment modes (UPI, CASH) only.
     * Validates the payment mode and maps DTO to entity.
     */
    @Transactional
    public TransactionResponseDto createManualPayment(PaymentRequestDto dto, Long tenantId, Long ownerId, Long propertyId) {
        String modeStr = dto.getPaymentMode().toUpperCase();
        if (!(modeStr.equals("UPI") || modeStr.equals("CASH"))) {
            throw new IllegalArgumentException("Only manual payment modes: UPI or CASH are supported currently.");
        }
        PaymentMode paymentMode = PaymentMode.valueOf(modeStr);

        Transaction transaction = Transaction.builder()
                .tenantId(tenantId)
                .ownerId(ownerId)
                .propertyId(propertyId)
                .amount(dto.getAmount())
                .paymentMonth(dto.getPaymentMonth())
                .paymentMode(paymentMode)
                .upiRef(dto.getUpiRef())
                .screenshotUrl(dto.getScreenshotUrl())
                .status(PaymentStatus.PENDING)
                .build();

        Transaction saved = repository.save(transaction);
        return mapToDto(saved);
    }

    public List<TransactionResponseDto> getTransactionsByOwnerAndStatus(Long ownerId, PaymentStatus status) {
        return repository.findByOwnerIdAndStatus(ownerId, status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<TransactionResponseDto> findDtoById(Long id) {
        return repository.findById(id).map(this::mapToDto);
    }

    public List<TransactionResponseDto> getTransactionsByTenantId(Long tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TransactionResponseDto> getTransactionsByOwnerId(Long ownerId) {
        return repository.findByOwnerId(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Mark payment as VERIFIED, sets paymentDate to now.
     * Checks that the owner owns the transaction.
     */
    @Transactional
    public TransactionResponseDto verifyTransaction(Long transactionId, Long ownerId) {
        Transaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (!transaction.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Unauthorized attempt to verify transaction");
        }

        transaction.setStatus(PaymentStatus.VERIFIED);
        transaction.setPaymentDate(LocalDateTime.now());
        Transaction updated = repository.save(transaction);
        return mapToDto(updated);
    }

    /**
     * Mark payment as REJECTED.
     * Checks owner authorization.
     */
    @Transactional
    public TransactionResponseDto rejectTransaction(Long transactionId, Long ownerId) {
        Transaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (!transaction.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Unauthorized attempt to reject transaction");
        }

        transaction.setStatus(PaymentStatus.REJECTED);
        Transaction updated = repository.save(transaction);
        return mapToDto(updated);
    }

    /**
     * Maps Transaction entity to response DTO.
     */
    private TransactionResponseDto mapToDto(Transaction tx) {
        return TransactionResponseDto.builder()
                .id(tx.getId())
                .tenantId(tx.getTenantId())
                .ownerId(tx.getOwnerId())
                .propertyId(tx.getPropertyId())
                .amount(tx.getAmount())
                .paymentMode(tx.getPaymentMode().name())
                .upiRef(tx.getUpiRef())
                .screenshotUrl(tx.getScreenshotUrl())
                .paymentMonth(tx.getPaymentMonth())
                .status(tx.getStatus().name())
                .paymentDate(tx.getPaymentDate() != null ? tx.getPaymentDate().toString() : null)
                .build();
    }
}
