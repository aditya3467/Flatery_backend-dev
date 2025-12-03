package com.Flatery.repository.property;

import com.Flatery.model.property.Property;
import com.Flatery.model.property.enums.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    Page<Property> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Property> findByOwnerIdAndType(Long ownerId, PropertyType type, Pageable pageable);

    Optional<Property> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("SELECT COUNT(DISTINCT p.ownerId) FROM com.Flatery.model.property.Property p")
    long countDistinctOwnerIds();
    
    // Demo property methods for testing
    long countByNameStartingWith(String namePrefix);
    
    @Modifying
    @Transactional
    long deleteByNameStartingWith(String namePrefix);
}
