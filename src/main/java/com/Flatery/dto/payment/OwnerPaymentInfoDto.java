package com.Flatery.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerPaymentInfoDto {

    private Long id;

    @NotNull(message = "Owner ID is required")
    private Long ownerId;

    private String upiId;

    private String qrImageUrl;

    private String preferredMode; // "UPI", "BANK_TRANSFER", "GATEWAY"

    private String bankName;

    private String accountNumber; // Should be encrypted in production

    private Boolean isActive;
}
