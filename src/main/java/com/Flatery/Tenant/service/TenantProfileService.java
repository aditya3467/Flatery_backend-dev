package com.Flatery.Tenant.service;

import com.Flatery.Tenant.dto.FamilyMemberDto;
import com.Flatery.Tenant.dto.TenantProfileRequestDto;
import com.Flatery.Tenant.dto.TenantProfileResponseDto;
import com.Flatery.Tenant.model.TenantProfile;
import com.Flatery.Tenant.repository.TenantProfileRepository;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.tenant.TenantRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Handles creation, update, and retrieval of tenant profile data.
 * Also synchronizes basic contact info with the tenancy table (Tenant entity).
 */
@Service
@RequiredArgsConstructor
public class TenantProfileService {

    private final TenantProfileRepository profileRepository;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    /**
     * Create or update a tenant profile.
     * Also updates tenancy table (name, phone, email) without touching other fields.
     */
    @Transactional
    public TenantProfileResponseDto saveOrUpdateProfile(Long tenantId, TenantProfileRequestDto request) {
        TenantProfile profile = profileRepository.findByTenantId(tenantId)
                .orElse(new TenantProfile());
        profile.setTenantId(tenantId);

        // ---- Personal Info ----
        profile.setFullName(request.getFullName());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setContactNumber(request.getContactNumber());
        profile.setEmailAddress(request.getEmailAddress());
        profile.setOccupation(request.getOccupation());
        profile.setPermanentAddress(request.getPermanentAddress());

        // ---- KYC ----
        profile.setIdType(request.getIdType());
        profile.setIdNumber(request.getIdNumber());
        profile.setIdProofUrl(request.getIdProofUrl());
        profile.setAddressProofUrl(request.getAddressProofUrl());
        profile.setPoliceVerificationUrl(request.getPoliceVerificationUrl());

        // ---- Emergency ----
        profile.setEmergencyContactName(request.getEmergencyContactName());
        profile.setEmergencyRelation(request.getEmergencyRelation());
        profile.setEmergencyPhone(request.getEmergencyPhone());
        profile.setAlternatePhone(request.getAlternatePhone());

        // ---- Payment ----
        profile.setPaymentMode(request.getPaymentMode());
        profile.setProfileCompleted(true);

        // ---- Family Members ----
        try {
            if (request.getMembers() != null && !request.getMembers().isEmpty()) {
                profile.setFamilyMembersJson(objectMapper.writeValueAsString(request.getMembers()));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error converting family members to JSON", e);
        }

        TenantProfile saved = profileRepository.save(profile);

        // ---- Synchronize shared fields with tenancy table ----
        Optional<Tenant> tenancyOpt = tenantRepository.findById(tenantId);
        tenancyOpt.ifPresent(tenancy -> {
            tenancy.setTenantName(request.getFullName());
            tenancy.setPhoneNumber(request.getContactNumber());
            tenancy.setEmailAddress(request.getEmailAddress());
            tenantRepository.save(tenancy);
        });

        return mapToResponse(saved);
    }

    /**
     * Fetch an existing tenant profile.
     */
    public TenantProfileResponseDto getProfile(Long tenantId) {
        TenantProfile profile = profileRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant profile not found"));
        return mapToResponse(profile);
    }

    // ===========================================================
    // Helper: map Entity -> Response DTO
    // ===========================================================
    private TenantProfileResponseDto mapToResponse(TenantProfile profile) {
        List<FamilyMemberDto> members = null;
        try {
            if (profile.getFamilyMembersJson() != null) {
                members = objectMapper.readValue(profile.getFamilyMembersJson(), new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        return TenantProfileResponseDto.builder()
                .tenantId(profile.getTenantId())
                .fullName(profile.getFullName())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .contactNumber(profile.getContactNumber())
                .emailAddress(profile.getEmailAddress())
                .occupation(profile.getOccupation())
                .permanentAddress(profile.getPermanentAddress())
                .profilePhotoUrl(profile.getProfilePhotoUrl())
                .idType(profile.getIdType())
                .idNumber(profile.getIdNumber())
                .idProofUrl(profile.getIdProofUrl())
                .addressProofUrl(profile.getAddressProofUrl())
                .policeVerificationUrl(profile.getPoliceVerificationUrl())
                .members(members)
                .emergencyContactName(profile.getEmergencyContactName())
                .emergencyRelation(profile.getEmergencyRelation())
                .emergencyPhone(profile.getEmergencyPhone())
                .alternatePhone(profile.getAlternatePhone())
                .paymentMode(profile.getPaymentMode())
                .profileCompleted(profile.isProfileCompleted())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
