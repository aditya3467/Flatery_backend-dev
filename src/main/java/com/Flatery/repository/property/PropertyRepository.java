package com.Flatery.repository.property;

import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.PropertyStatus;
import com.Flatery.model.property.enums.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    Page<Property> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Property> findByOwnerIdAndType(Long ownerId, PropertyType type, Pageable pageable);

    Optional<Property> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("SELECT COUNT(DISTINCT p.ownerId) FROM com.Flatery.model.property.Property p")
    long countDistinctOwnerIds();

    // Get latest 3 properties for recommended section
    List<Property> findTop3ByOrderByPostedOnDesc();
    
    // Superadmin statistics queries
    long countByStatus(PropertyStatus status);
    
    long countByType(PropertyType type);
    
    // Count properties by owner
    long countByOwnerId(Long ownerId);
}
