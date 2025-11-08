package com.Flatery.service.property;

<<<<<<< HEAD
import com.Flatery.model.property.PropertyImage;
import com.Flatery.repository.property.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public void deleteAllForProperty(Long propertyId) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderByPositionAsc(propertyId);
        
        // Delete files from disk
        for (PropertyImage image : images) {
            fileStorageService.deleteFile(image.getUrl());
        }
        
        // Delete records from database
        propertyImageRepository.deleteAll(images);
=======
import org.springframework.stereotype.Service;

@Service
public class PropertyImageService {

    public String getPrimaryImageUrl(Long propertyId) {
        return null; // implement in Phase 2
    }

    public void deleteAllForProperty(Long propertyId) {
        // implement in Phase 2
>>>>>>> c3e6d02454c89c98dada3de88b207017dc57121f
    }
}
