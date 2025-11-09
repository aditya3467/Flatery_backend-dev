package com.Flatery.Tenant.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId; // Links to tenancy table (Tenant.id)

    // Personal Info
    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "email_address", length = 150)
    private String emailAddress;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "permanent_address", length = 500)
    private String permanentAddress;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    // KYC
    @Column(name = "id_type", length = 50)
    private String idType;

    @Column(name = "id_number", length = 100)
    private String idNumber;

    @Column(name = "id_proof_url")
    private String idProofUrl;

    @Column(name = "address_proof_url")
    private String addressProofUrl;

    @Column(name = "police_verification_url")
    private String policeVerificationUrl;

    // Family Info (JSON string)
    @Column(name = "family_members_json", columnDefinition = "TEXT")
    private String familyMembersJson;

    // Emergency Details
    @Column(name = "emergency_contact_name", length = 150)
    private String emergencyContactName;

    @Column(name = "emergency_relation", length = 50)
    private String emergencyRelation;

    @Column(name = "emergency_phone", length = 20)
    private String emergencyPhone;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    // Payment
    @Column(name = "payment_mode", length = 50)
    private String paymentMode;

    @Column(name = "profile_completed")
    private boolean profileCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
