package com.Flatery.Tenant.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO used when tenant submits or updates their profile details.
 */
@Data
public class TenantProfileRequestDto {

    // ===== Personal Info =====
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String contactNumber;
    private String emailAddress;
    private String occupation;
    private String permanentAddress;

    // ===== Identification & KYC =====
    private String idType;
    private String idNumber;
    private String idProofUrl;
    private String addressProofUrl;
    private String policeVerificationUrl;

    // ===== Family / Occupant Info =====
    private List<FamilyMemberDto> members;

    // ===== Emergency Details =====
    private String emergencyContactName;
    private String emergencyRelation;
    private String emergencyPhone;
    private String alternatePhone;

    // ===== Payment & Preferences =====
    private String paymentMode;
}
