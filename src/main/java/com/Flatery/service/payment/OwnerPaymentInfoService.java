package com.Flatery.service.payment;

import com.Flatery.dto.payment.OwnerPaymentInfoDto;
import com.Flatery.model.payment.OwnerPaymentInfo;
import com.Flatery.model.payment.PaymentMode;
import com.Flatery.repository.payment.OwnerPaymentInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OwnerPaymentInfoService {

    private final OwnerPaymentInfoRepository repository;

    /**
     * Get payment info for a specific owner
     */
    public Optional<OwnerPaymentInfoDto> getByOwnerId(Long ownerId) {
        return repository.findByOwnerId(ownerId).map(this::mapToDto);
    }

    /**
     * Create or update owner payment information
     */
    @Transactional
    public OwnerPaymentInfoDto saveOrUpdate(Long ownerId, OwnerPaymentInfoDto dto) {
        OwnerPaymentInfo info = repository.findByOwnerId(ownerId)
                .orElse(new OwnerPaymentInfo());

        // Set basic fields
        info.setOwnerId(ownerId);
        info.setUpiId(dto.getUpiId());
        if (dto.getQrImageUrl() != null && !dto.getQrImageUrl().isBlank()) {
            info.setQrImageUrl(dto.getQrImageUrl());
        }

        if (dto.getPreferredMode() != null) {
            info.setPreferredMode(PaymentMode.valueOf(dto.getPreferredMode().toUpperCase()));
        }

        info.setBankName(dto.getBankName());
        info.setAccountNumber(dto.getAccountNumber());
        info.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        // Set audit fields if new record
        if (info.getId() == null) {
            info.setCreatedBy("OWNER_" + ownerId);
        }
        info.setUpdatedBy("OWNER_" + ownerId);

        OwnerPaymentInfo saved = repository.save(info);
        return mapToDto(saved);
    }

    /**
     * Check if payment info exists for owner
     */
    public boolean existsForOwner(Long ownerId) {
        return repository.existsByOwnerId(ownerId);
    }

    /**
     * Deactivate payment info
     */
    @Transactional
    public void deactivate(Long ownerId) {
        repository.findByOwnerId(ownerId).ifPresent(info -> {
            info.setIsActive(false);
            repository.save(info);
        });
    }

    /**
     * Activate payment info
     */
    @Transactional
    public void activate(Long ownerId) {
        repository.findByOwnerId(ownerId).ifPresent(info -> {
            info.setIsActive(true);
            repository.save(info);
        });
    }

    /**
     * Map entity to DTO
     */
    private OwnerPaymentInfoDto mapToDto(OwnerPaymentInfo info) {
        return OwnerPaymentInfoDto.builder()
                .id(info.getId())
                .ownerId(info.getOwnerId())
                .upiId(info.getUpiId())
                .qrImageUrl(info.getQrImageUrl())
                .preferredMode(info.getPreferredMode() != null ? info.getPreferredMode().name() : null)
                .bankName(info.getBankName())
                .accountNumber(info.getAccountNumber())
                .isActive(info.getIsActive())
                .build();
    }
}
