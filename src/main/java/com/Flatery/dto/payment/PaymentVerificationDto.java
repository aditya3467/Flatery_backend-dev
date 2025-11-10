package com.Flatery.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationDto {

    @NotNull(message = "Transaction ID is required")
    private Long transactionId;

    @NotNull(message = "Verification status is required")
    private Boolean verified;  // true for verify, false for reject

}
