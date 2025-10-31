package com.Flatery.repository.property;

import com.Flatery.model.property.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByPropertyIdOrderByPositionAsc(Long propertyId);
    long countByPropertyId(Long propertyId);
}
