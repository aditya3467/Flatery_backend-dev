package com.Flatery.service.property;

import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.service.property.mapper.PropertyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyQueryService {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper mapper;
    private final PropertyImageService imageService;

    @Transactional(readOnly = true)
    public PropertyResponse getPublicById(Long id) {
        Property p = propertyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));
        String primary = imageService.getPrimaryImageUrl(p.getId());
        return mapper.toResponse(p, primary);
    }

    @Transactional(readOnly = true)
    public Page<PropertySummary> search(
            String city,
            String location,
            PropertyType type,
            BhkType bhk,
            Integer minRent,
            Integer maxRent,
            Furnishing furnishing,
            Double lat,
            Double lng,
            Double radiusKm,
            Pageable pageable
    ) {
        // If no location filters at all, use DB pagination for speed
        boolean isRadiusSearch = (lat != null && lng != null);
        
        if (!isRadiusSearch) {
            // Simple DB query with pagination - FAST
            Page<Property> page = propertyRepository.searchProperties(
                city, location, type, bhk, minRent, maxRent, furnishing, pageable
            );
            
            // Batch fetch images for the page
            List<Long> propertyIds = page.getContent().stream()
                .map(Property::getId)
                .toList();
            Map<Long, String> imageMap = imageService.getPrimaryImageUrls(propertyIds);
            
            List<PropertySummary> summaries = page.getContent().stream()
                .map(p -> mapper.toSummary(p, imageMap.get(p.getId())))
                .toList();
            
            return new PageImpl<>(summaries, pageable, page.getTotalElements());
        }
        
        // Radius search - need to load all and filter by distance
        List<Property> all = propertyRepository.searchProperties(
            null, null, type, bhk, minRent, maxRent, furnishing, Pageable.unpaged()
        ).getContent();
        
        Double usedRadius = radiusKm != null ? radiusKm : 10.0; // Default 10km
        
        List<Property> filtered = all.stream()
            .filter(this::hasCoords)
            .filter(p -> distanceKm(lat, lng, p.getLatitude(), p.getLongitude()) <= usedRadius)
            .sorted((a, b) -> {
                double da = distanceKm(lat, lng, a.getLatitude(), a.getLongitude());
                double db = distanceKm(lat, lng, b.getLatitude(), b.getLongitude());
                return Double.compare(da, db);
            })
            .toList();
        
        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Property> pageContent = start >= filtered.size() ? List.of() : filtered.subList(start, end);
        
        // Batch fetch images
        List<Long> propertyIds = pageContent.stream().map(Property::getId).toList();
        Map<Long, String> imageMap = imageService.getPrimaryImageUrls(propertyIds);
        
        // Map with distance
        List<PropertySummary> summaries = pageContent.stream()
            .map(p -> {
                Double d = distanceKm(lat, lng, p.getLatitude(), p.getLongitude());
                return mapper.toSummary(p, imageMap.get(p.getId()), d);
            })
            .toList();
        
        return new PageImpl<>(summaries, pageable, filtered.size());
    }

    private boolean hasCoords(Property p) {
        return p.getLatitude() != null && p.getLongitude() != null;
    }

    private boolean equalsIgnoreCase(String a, String b) {
        return a != null && b != null && a.equalsIgnoreCase(b);
    }

    private boolean containsIgnoreCase(String a, String b) {
        return a != null && b != null && a.toLowerCase().contains(b.toLowerCase());
    }

    // Haversine distance in km
    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Transactional(readOnly = true)
    public List<PropertySummary> getRecommendedProperties() {
        // Simple: return 3 latest properties
        List<Property> properties = propertyRepository.findTop3ByOrderByPostedOnDesc();
        return properties.stream()
                .map(p -> mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId())))
                .toList();
    }

    /**
     * Get properties by IDs (for popular/trending)
     */
    @Transactional(readOnly = true)
    public List<PropertySummary> getPropertiesByIds(List<Long> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        
        List<Property> properties = propertyRepository.findAllById(propertyIds);
        
        // Maintain order from input list
        Map<Long, Property> propertyMap = properties.stream()
                .collect(Collectors.toMap(Property::getId, p -> p));
        
        return propertyIds.stream()
                .filter(propertyMap::containsKey)
                .map(id -> {
                    Property p = propertyMap.get(id);
                    return mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId()));
                })
                .collect(Collectors.toList());
    }
}
