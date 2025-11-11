package com.Flatery.dto.payment;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptResponseDto {

    private Long id;
    private Long transactionId;
    private String receiptUrl;
    private String createdAt;
}
