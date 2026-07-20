package com.Flatery.service.property;

import com.Flatery.dto.property.PropertyResponse;
import com.Flatery.dto.property.PropertySummary;
import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.BhkType;
import com.Flatery.model.property.enums.Furnishing;
import com.Flatery.model.property.enums.PropertyStatus;
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
        List<Property> all = propertyRepository.findAll();

        // Basic attribute filters first
        // Skip city/location filters when doing radius search (lat/lng provided)
        boolean isRadiusSearch = (lat != null && lng != null);
        List<Property> filtered = all.stream()
                .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
                .filter(p -> isRadiusSearch || city == null || equalsIgnoreCase(p.getCity(), city))
                .filter(p -> isRadiusSearch || location == null || containsIgnoreCase(p.getLocation(), location))
                .filter(p -> type == null || type == p.getType())
                .filter(p -> bhk == null || bhk == p.getBhkType())
                .filter(p -> minRent == null || (p.getExpectedRent() != null && p.getExpectedRent() >= minRent))
                .filter(p -> maxRent == null || (p.getExpectedRent() != null && p.getExpectedRent() <= maxRent))
                .filter(p -> furnishing == null || furnishing == p.getFurnishing())
                .toList();

        Double usedRadius = null;
        if (lat != null && lng != null) {
            double[] radii = radiusKm != null ? new double[]{radiusKm} : new double[]{2, 5, 10};
            for (double r : radii) {
                List<Property> within = filtered.stream()
                        .filter(p -> hasCoords(p))
                        .filter(p -> distanceKm(lat, lng, p.getLatitude(), p.getLongitude()) <= r)
                        .toList();
                if (!within.isEmpty()) {
                    filtered = within;
                    usedRadius = r;
                    break;
                }
            }
        }

        // Sort: by distance if available, else posted date desc
        filtered = filtered.stream()
                .sorted((a, b) -> {
                    Double da = (lat != null && lng != null && hasCoords(a)) ? distanceKm(lat, lng, a.getLatitude(), a.getLongitude()) : null;
                    Double db = (lat != null && lng != null && hasCoords(b)) ? distanceKm(lat, lng, b.getLatitude(), b.getLongitude()) : null;
                    if (da != null && db != null) return da.compareTo(db);
                    if (da != null) return -1;
                    if (db != null) return 1;
                    // fallback: postedOn desc
                    if (a.getPostedOn() != null && b.getPostedOn() != null) return b.getPostedOn().compareTo(a.getPostedOn());
                    return 0;
                })
                .toList();

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Property> pageContent = start > end ? List.of() : filtered.subList(start, end);

        // Map with distance
        List<PropertySummary> summaries = pageContent.stream()
                .map(p -> {
                    Double d = null;
                    if (lat != null && lng != null && hasCoords(p)) {
                        d = distanceKm(lat, lng, p.getLatitude(), p.getLongitude());
                    }
                    return mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId()), d);
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
        // Simple: return 3 latest ACTIVE properties
        List<Property> properties = propertyRepository.findTop3ByOrderByPostedOnDesc();
        return properties.stream()
                .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
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
                .filter(p -> p.getStatus() == PropertyStatus.ACTIVE)
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
