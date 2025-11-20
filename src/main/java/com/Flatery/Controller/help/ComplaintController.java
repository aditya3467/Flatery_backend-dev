package com.Flatery.Controller.help;

import com.Flatery.dto.help.*;
import com.Flatery.model.help.Category;
import com.Flatery.model.help.helpstatus;
import com.Flatery.service.help.*;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Complaints", description = "Complaint Management APIs for Tenants and Owners")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintFileService fileService;
    private final TenantContextService contextService;

    // ==================== TENANT ENDPOINTS ====================

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create new complaint (Tenant)", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Complaint created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<ComplaintDetailResponse> createComplaint(
            @Parameter(description = "Category", required = true,
                    schema = @Schema(allowableValues = {"WATER", "ELECTRICITY", "CLEANING", "MAINTENANCE", "PEST_CONTROL", "SECURITY", "OTHERS"}))
            @RequestParam("category") Category category,

            @Parameter(description = "Title (5-150 chars)", required = true)
            @RequestParam("title") String title,

            @Parameter(description = "Description (10-1000 chars)", required = true)
            @RequestParam("description") String description,

            @Parameter(description = "Preferred date (YYYY-MM-DD)")
            @RequestParam(value = "preferredResolutionDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate preferredResolutionDate,

            @Parameter(description = "Photo (max 5MB)")
            @RequestParam(value = "file", required = false) MultipartFile file,

            Authentication authentication) {

        // Validate input
        if (title == null || title.trim().length() < 5 || title.trim().length() > 150) {
            throw new IllegalArgumentException("Title must be between 5 and 150 characters");
        }
        if (description == null || description.trim().length() < 10 || description.trim().length() > 1000) {
            throw new IllegalArgumentException("Description must be between 10 and 1000 characters");
        }

        // Build request
        ComplaintCreateRequest request = ComplaintCreateRequest.builder()
                .category(category)
                .title(title.trim())
                .description(description.trim())
                .preferredResolutionDate(preferredResolutionDate)
                .build();

        // Extract context
        Long tenantId = contextService.getUserIdFromAuth(authentication);
        Long ownerId = contextService.getOwnerIdFromAuth(authentication);
        Long propertyId = contextService.getPropertyIdFromAuth(authentication);

        // Create complaint
        ComplaintDetailResponse response = complaintService.createComplaint(
                request, tenantId, ownerId, propertyId, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tenant/my-complaints")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get all my complaints (Tenant)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ComplaintSummaryResponse>> getTenantComplaints(
            @RequestParam(required = false) helpstatus status,
            Authentication authentication) {

        Long tenantId = contextService.getUserIdFromAuth(authentication);
        List<ComplaintSummaryResponse> complaints = complaintService.getTenantComplaints(tenantId, status);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/tenant/stats")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get complaint statistics (Tenant)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintStatsResponse> getTenantStats(Authentication authentication) {
        Long tenantId = contextService.getUserIdFromAuth(authentication);
        ComplaintStatsResponse stats = complaintService.getTenantStats(tenantId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Get complaint details", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintDetailResponse> getComplaintById(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = contextService.getUserIdFromAuth(authentication);
        String role = contextService.getRoleFromAuth(authentication);
        ComplaintDetailResponse complaint = complaintService.getComplaintById(id, userId, role);
        return ResponseEntity.ok(complaint);
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Verify complaint resolution (Tenant)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintDetailResponse> verifyResolution(
            @PathVariable Long id,
            Authentication authentication) {

        Long tenantId = contextService.getUserIdFromAuth(authentication);
        ComplaintDetailResponse response = complaintService.verifyResolution(id, tenantId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reopen")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Reopen complaint (Tenant)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintDetailResponse> reopenComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintReopenRequest request,
            Authentication authentication) {

        Long tenantId = contextService.getUserIdFromAuth(authentication);
        ComplaintDetailResponse response = complaintService.reopenComplaint(id, request, tenantId);
        return ResponseEntity.ok(response);
    }

    // ==================== OWNER ENDPOINTS ====================

    @GetMapping("/owner/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Get pending complaints (Owner)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ComplaintSummaryResponse>> getOwnerPendingComplaints(Authentication authentication) {
        Long ownerId = contextService.getUserIdFromAuth(authentication);
        List<ComplaintSummaryResponse> complaints = complaintService.getOwnerPendingComplaints(ownerId);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/owner/my-complaints")
    // @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Get all complaints (Owner)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ComplaintSummaryResponse>> getOwnerComplaints(
            @RequestParam(required = false) helpstatus status,
            Authentication authentication) {

        try {
            Long ownerId = contextService.getUserIdFromAuth(authentication);
            List<ComplaintSummaryResponse> complaints = complaintService.getOwnerComplaints(ownerId, status);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            log.error("Error in getOwnerComplaints: " + e.getMessage(), e);
            // Return empty list for debugging
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/owner/stats")
    // @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Get complaint statistics (Owner)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintStatsResponse> getOwnerStats(Authentication authentication) {
        try {
            // For owner endpoints, use the user ID directly as owner ID
            Long ownerId = contextService.getUserIdFromAuth(authentication);
            ComplaintStatsResponse stats = complaintService.getOwnerStats(ownerId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error in getOwnerStats: " + e.getMessage(), e);
            // Return empty stats for debugging
            ComplaintStatsResponse emptyStats = new ComplaintStatsResponse();
            return ResponseEntity.ok(emptyStats);
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Update complaint status (Owner)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ComplaintDetailResponse> updateComplaintStatus(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintUpdateStatusRequest request,
            Authentication authentication) {

        Long ownerId = contextService.getUserIdFromAuth(authentication);
        ComplaintDetailResponse response = complaintService.updateComplaintStatus(id, request, ownerId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/responses")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Operation(summary = "Add response/comment (Owner)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> addComplaintResponse(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintResponseRequest request,
            Authentication authentication) {

        Long ownerId = contextService.getUserIdFromAuth(authentication);
        complaintService.addComplaintResponse(id, ownerId, request.getMessage(),
                request.getResponseType(), true);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/uploads/complaints/{complaintId}/{filename}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Download complaint attachment", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> getComplaintFile(
            @PathVariable String complaintId,
            @PathVariable String filename) {

        byte[] fileData = fileService.getFile("uploads/complaints/" + complaintId + "/" + filename);

        String contentType = "image/jpeg";
        if (filename.toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        } else if (filename.toLowerCase().endsWith(".gif")) {
            contentType = "image/gif";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileData);
    }
}
