package com.Flatery.Controller.property;

import com.Flatery.dto.property.CreatePropertyRequest;
import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.dto.property.UpdatePropertyRequest;
import com.Flatery.service.property.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/properties")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
public class AdminPropertyController {

    private final PropertyService propertyService;

    // Create new property (owner = current admin)
    @PostMapping
    public ResponseEntity<PropertyResponse> create(
            @Valid @RequestBody CreatePropertyRequest req,
            Authentication auth
    ) {
        Long ownerId = getUserId(auth);
        PropertyResponse res = propertyService.create(req, ownerId);
        return ResponseEntity.status(201).body(res);
    }

    // Update existing property (must belong to admin unless SUPERADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePropertyRequest req,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        PropertyResponse res = propertyService.update(id, req, userId);
        return ResponseEntity.ok(res);
    }

    // Delete property
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        propertyService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Get one of my properties (or any if SUPERADMIN)
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getOne(
            @PathVariable Long id,
            Authentication auth
    ) {
        Long userId = getUserId(auth);
        PropertyResponse res = propertyService.getByIdForOwner(id, userId);
        return ResponseEntity.ok(res);
    }

    // List my properties (or all if SUPERADMIN uses query param ?all=true)
    @GetMapping
    public ResponseEntity<Page<PropertySummary>> listMine(
            @RequestParam(value = "all", defaultValue = "false") boolean all,
            Authentication auth,
            Pageable pageable
    ) {
        Long userId = getUserId(auth);
        Page<PropertySummary> page = propertyService.listForOwner(userId, all, pageable);
        return ResponseEntity.ok(page);
    }

    // Extract user id from Authentication principal (adapt to your JWT principal)
    private Long getUserId(Authentication auth) {
        // Example: if principal stores userId as name (string), or a custom ClaimsUser
        // return ((ClaimsUser) auth.getPrincipal()).getUserId();
        return Long.valueOf(auth.getName()); // replace with your actual principal mapping
    }
}
