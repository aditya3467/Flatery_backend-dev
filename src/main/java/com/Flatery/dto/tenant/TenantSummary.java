package com.Flatery.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantSummary {
    private Long id;
    private String tenantId;
    private String tenantName;
    private String status;
    private Integer rentAmount;
    private Integer securityDeposit;
}
