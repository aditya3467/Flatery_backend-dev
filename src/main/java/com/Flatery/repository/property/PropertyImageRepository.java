package com.Flatery.repository.property;

import com.Flatery.model.property.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByPropertyIdOrderByPositionAsc(Long propertyId);
    long countByPropertyId(Long propertyId);
    
    @Query("SELECT pi FROM PropertyImage pi WHERE pi.propertyId IN :propertyIds ORDER BY pi.propertyId, pi.position ASC")
    List<PropertyImage> findByPropertyIdInOrderByPositionAsc(@Param("propertyIds") List<Long> propertyIds);
}
