package com.Flatery.dto.tenant;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddTenantRequest {
    @NotBlank
    @Size(max = 100)
    private String tenantName;

    // Contact
    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @Email
    private String emailAddress; // optional

    // Links
    @NotNull
    private Long propertyId;

    @NotBlank
    @Size(max = 40)
    private String flatRoomNumber;

    // Financials
    @NotNull @Min(0)
    private Integer rentAmount;

    @NotNull @Min(0)
    private Integer securityDeposit;

    // Rent due day (1-31)
    @NotNull @Min(1) @Max(31)
    private Integer rentDueDate;

    // Lease dates
    @NotNull
    private String leaseStartDate; // ISO date (yyyy-MM-dd)

    private String leaseEndDate; // optional ISO date

    // Account
    private String temporaryPassword; // optional; auto-generated if not provided

    // Status
    private String status; // ACTIVE | PENDING_INFO | VACATED
}
