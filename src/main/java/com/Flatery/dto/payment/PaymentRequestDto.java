package com.Flatery.dto.payment;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDto {

    private Long tenantId;      // Optional - for owner-created payments

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Payment month is required, e.g., 'Nov 2025'")
    private String paymentMonth;

    @NotBlank(message = "Payment mode is required")
    private String paymentMode; // e.g., "UPI", "BANK_TRANSFER", etc.

    private String upiRef;      // Optional for manual payments

    private String screenshotUrl; // Optional proof URL or base64 encoded

}
