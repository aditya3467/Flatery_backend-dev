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
            Pageable pageable
    ) {
        // Fetch all properties and convert to summaries
        Page<Property> page = propertyRepository.findAll(pageable);
        
        // For now, return all properties (filtering can be added later)
        // Convert to summaries with primary image url
        return page.map(p -> mapper.toSummary(p, imageService.getPrimaryImageUrl(p.getId())));
    }
}
