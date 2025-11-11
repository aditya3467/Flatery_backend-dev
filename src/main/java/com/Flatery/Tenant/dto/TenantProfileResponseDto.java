package com.Flatery.Tenant.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO returned when tenant or system fetches profile details.
 */
@Data
@Builder
public class TenantProfileResponseDto {

    private Long tenantId;

    // ===== Personal Info =====
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String contactNumber;
    private String emailAddress;
    private String occupation;
    private String permanentAddress;
    private String profilePhotoUrl;

    // ===== KYC =====
    private String idType;
    private String idNumber;
    private String idProofUrl;
    private String addressProofUrl;
    private String policeVerificationUrl;

    // ===== Family =====
    private List<FamilyMemberDto> members;

    // ===== Emergency =====
    private String emergencyContactName;
    private String emergencyRelation;
    private String emergencyPhone;
    private String alternatePhone;

    // ===== Payment =====
    private String paymentMode;

    // ===== Status =====
    private boolean profileCompleted;
    private LocalDateTime updatedAt;
}
