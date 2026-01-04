package com.Flatery.Controller.property;

import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.dto.property.PropertyViewRequest;
import com.Flatery.model.property.PropertyImage;
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.model.User;
import com.Flatery.repository.property.PropertyImageRepository;
import com.Flatery.service.property.PropertyQueryService;
import com.Flatery.service.property.PropertyViewService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PublicPropertyController {

    private final PropertyQueryService queryService;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyViewService viewService;

    // Public detail
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(queryService.getPublicById(id));
    }

    // Public search with common filters
    @GetMapping
    public ResponseEntity<Page<PropertySummary>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BhkType bhk,
            @RequestParam(required = false) Integer minRent,
            @RequestParam(required = false) Integer maxRent,
            @RequestParam(required = false) Furnishing furnishing,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            Pageable pageable
    ) {
        Page<PropertySummary> page = queryService.search(city, location, type, bhk, minRent, maxRent, furnishing, lat, lng, radiusKm, pageable);
        return ResponseEntity.ok(page);
    }

    // Get images for a property (public endpoint)
    @GetMapping("/{id}/images")
    public ResponseEntity<List<PropertyImage>> getPropertyImages(@PathVariable Long id) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(id);
        return ResponseEntity.ok(images);
    }

    // Recommended properties - latest 3 properties
    @GetMapping("/recommended")
    public ResponseEntity<List<PropertySummary>> getRecommendedProperties() {
        List<PropertySummary> properties = queryService.getRecommendedProperties();
        return ResponseEntity.ok(properties);
    }

    // Record property view
    @PostMapping("/{id}/view")
    public ResponseEntity<?> recordPropertyView(
            @PathVariable Long id,
            @RequestBody PropertyViewRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest
    ) {
        String ipHash = hashIP(httpRequest.getRemoteAddr());
        
        boolean recorded = viewService.recordView(
                id,
                user,
                request.getSessionId(),
                ipHash,
                request.getReferrer(),
                request.getViewDurationSeconds()
        );

        return ResponseEntity.ok(new ViewRecordResponse(recorded));
    }

    // Get view count for a property
    @GetMapping("/{id}/views")
    public ResponseEntity<PropertyViewsResponse> getPropertyViews(@PathVariable Long id) {
        long totalViews = viewService.getPropertyViewCount(id);
        long uniqueViewers = viewService.getUniqueViewerCount(id);
        
        PropertyViewsResponse response = new PropertyViewsResponse();
        response.setPropertyId(id);
        response.setTotalViews(totalViews);
        response.setUniqueViewers(uniqueViewers);
        
        return ResponseEntity.ok(response);
    }

    private String hashIP(String ip) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ip.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return null;
        }
    }

    // Response DTOs
    record ViewRecordResponse(boolean recorded) {}
    
    @lombok.Data
    static class PropertyViewsResponse {
        private Long propertyId;
        private long totalViews;
        private long uniqueViewers;
    }
}
