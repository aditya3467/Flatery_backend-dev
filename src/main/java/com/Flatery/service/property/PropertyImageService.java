package com.Flatery.service.property;

import com.Flatery.model.property.PropertyImage;
import com.Flatery.repository.property.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyImageService {

    private final PropertyImageRepository propertyImageRepository;
    private final FileStorageService fileStorageService;

    public String getPrimaryImageUrl(Long propertyId) {
        // Get the primary image for this property
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(propertyId);
        
        if (images.isEmpty()) {
            return null;
        }
        
        // Return the primary image, or the first image if no primary is set
        String imageUrl = images.stream()
                .filter(PropertyImage::isPrimaryImage)
                .findFirst()
                .map(PropertyImage::getUrl)
                .orElseGet(() -> images.get(0).getUrl());
        
        return imageUrl;
    }
    
    /**
     * Batch fetch primary image URLs for multiple properties to avoid N+1 queries
     */
    public Map<Long, String> getPrimaryImageUrls(List<Long> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Map.of();
        }
        
        // Fetch all images for all properties in one query
        List<PropertyImage> allImages = propertyImageRepository.findByPropertyIdInOrderByPositionAsc(propertyIds);
        
        // Group by property ID
        Map<Long, List<PropertyImage>> imagesByProperty = allImages.stream()
            .collect(Collectors.groupingBy(PropertyImage::getPropertyId));
        
        // Extract primary or first image for each property
        Map<Long, String> result = new HashMap<>();
        for (Long propertyId : propertyIds) {
            List<PropertyImage> images = imagesByProperty.get(propertyId);
            if (images != null && !images.isEmpty()) {
                String url = images.stream()
                    .filter(PropertyImage::isPrimaryImage)
                    .findFirst()
                    .map(PropertyImage::getUrl)
                    .orElseGet(() -> images.get(0).getUrl());
                result.put(propertyId, url);
            }
        }
        
        return result;
    }

    public void deleteAllForProperty(Long propertyId) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(propertyId);
        
        // Delete files from disk
        for (PropertyImage image : images) {
            fileStorageService.deleteFile(image.getUrl());
        }
        
        // Delete records from database
        propertyImageRepository.deleteAll(images);
    }
}
