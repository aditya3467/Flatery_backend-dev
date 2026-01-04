package com.Flatery.superadmin.service;

import com.Flatery.model.property.Property;
import com.Flatery.model.property.PropertyImage;
import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.property.enums.PropertyType;
import com.Flatery.repository.property.PropertyRepository;
import com.Flatery.repository.property.PropertyImageRepository;
import com.Flatery.repository.property.PropertyViewRepository;
import com.Flatery.superadmin.dto.PropertyModerationDto;
import com.Flatery.superadmin.dto.PropertyListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for property moderation in SuperAdmin panel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyModerationService {

    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyViewRepository propertyViewRepository;

    /**
     * Get paginated list of all properties with filters
     */
    @Transactional(readOnly = true)
    public PropertyListResponse getAllProperties(int page, int size, PropertyStatus status, 
                                                  PropertyType type, Boolean verified, String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, "postedOn");
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Property> propertyPage = propertyRepository.findAll(pageable);
        
        // Apply filters (simplified - could use Specification for better filtering)
        List<Property> filtered = propertyPage.getContent().stream()
                .filter(p -> status == null || p.getStatus() == status)
                .filter(p -> type == null || p.getType() == type)
                .filter(p -> search == null || search.trim().isEmpty() || 
                        p.getName() != null && p.getName().toLowerCase().contains(search.toLowerCase()) ||
                        p.getCity().toLowerCase().contains(search.toLowerCase()))
                .collect(Collectors.toList());
        
        List<PropertyModerationDto> properties = filtered.stream()
                .map(this::convertToPropertyModerationDto)
                .collect(Collectors.toList());
        
        return PropertyListResponse.builder()
                .properties(properties)
                .totalElements((long) filtered.size())
                .totalPages((int) Math.ceil((double) filtered.size() / size))
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    /**
     * Get property details by ID
     */
    @Transactional(readOnly = true)
    public PropertyModerationDto getPropertyById(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        return convertToPropertyModerationDto(property);
    }

    /**
     * Update property status (approve/block)
     */
    @Transactional
    public void updatePropertyStatus(Long propertyId, PropertyStatus newStatus) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        property.setStatus(newStatus);
        propertyRepository.save(property);
        
        log.info("Property {} status updated to {}", propertyId, newStatus);
    }

    /**
     * Mark property as verified
     */
    @Transactional
    public void verifyProperty(Long propertyId, boolean verified) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Note: Property model doesn't have a verified field currently
        // This is a placeholder for future implementation
        
        log.info("Property {} verification set to {} (feature pending)", propertyId, verified);
    }

    /**
     * Convert Property entity to PropertyModerationDto
     */
    private PropertyModerationDto convertToPropertyModerationDto(Property property) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(property.getId());
        PropertyImage primaryImage = images.stream()
                .filter(PropertyImage::isPrimaryImage)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));
        
        Long totalViews = propertyViewRepository.countByPropertyId(property.getId());
        
        // Get property title (name for PG/APARTMENT, flat number for FLAT)
        String title = property.getName() != null ? property.getName() : 
                      (property.getFlatNumber() != null ? "Flat " + property.getFlatNumber() : "Property #" + property.getId());
        
        return PropertyModerationDto.builder()
                .id(property.getId())
                .title(title)
                .type(property.getType())
                .status(property.getStatus())
                .address(property.getLocation())
                .city(property.getCity())
                .state("N/A") // State not in Property model
                .monthlyRent(property.getExpectedRent().doubleValue())
                .ownerId(property.getOwnerId())
                .ownerName("Owner #" + property.getOwnerId()) // Owner relationship not eagerly loaded
                .ownerEmail(null)
                .ownerPhone(null)
                .availableRooms(0) // Not directly in Property model
                .totalFloors(property.getTotalFloor())
                .verified(false) // Property doesn't have verified field yet
                .postedOn(property.getPostedOn().atStartOfDay()) // Convert LocalDate to LocalDateTime
                .lastModified(null) // Property doesn't have updatedAt field
                .totalViews(totalViews)
                .enquiries(0L) // Placeholder
                .primaryImageUrl(primaryImage != null ? primaryImage.getUrl() : null)
                .totalImages(images.size())
                .build();
    }
}
