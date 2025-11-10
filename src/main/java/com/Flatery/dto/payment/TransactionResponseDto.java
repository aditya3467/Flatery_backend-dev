package com.Flatery.dto.payment;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDto {

    private Long id;
    private Long tenantId;
    private Long ownerId;
    private Long propertyId;
    private Double amount;
    private String paymentMode;
    private String upiRef;
    private String screenshotUrl;
    private String paymentMonth;
    private String status;
    private String paymentDate;

}
