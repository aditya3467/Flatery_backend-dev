package com.Flatery.service.payment;

import com.Flatery.dto.payment.ReceiptResponseDto;
import com.Flatery.model.payment.Receipt;
import com.Flatery.repository.payment.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReceiptService {

    private final ReceiptRepository repository;

    /**
     * Create a new receipt for a transaction
     */
    @Transactional
    public ReceiptResponseDto createReceipt(Long transactionId, String receiptUrl) {
        Receipt receipt = Receipt.builder()
                .transactionId(transactionId)
                .receiptUrl(receiptUrl)
                .build();

        Receipt saved = repository.save(receipt);
        return mapToDto(saved);
    }

    /**
     * Get receipt by transaction ID
     */
    public Optional<ReceiptResponseDto> findByTransactionId(Long transactionId) {
        return repository.findByTransactionId(transactionId).map(this::mapToDto);
    }

    /**
     * Get receipt by receipt ID
     */
    public Optional<ReceiptResponseDto> findById(Long id) {
        return repository.findById(id).map(this::mapToDto);
    }

    /**
     * Delete receipt
     */
    @Transactional
    public void deleteReceipt(Long id) {
        repository.deleteById(id);
    }

    /**
     * Map entity to DTO
     */
    private ReceiptResponseDto mapToDto(Receipt receipt) {
        return ReceiptResponseDto.builder()
                .id(receipt.getId())
                .transactionId(receipt.getTransactionId())
                .receiptUrl(receipt.getReceiptUrl())
                .createdAt(receipt.getCreatedAt() != null ? receipt.getCreatedAt().toString() : null)
                .build();
    }
}
