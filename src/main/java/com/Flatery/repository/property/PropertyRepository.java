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
    
    // Efficient search with filters at database level
    @Query("""
        SELECT p FROM Property p 
        WHERE (:city IS NULL OR LOWER(p.city) = LOWER(:city))
        AND (:location IS NULL OR LOWER(p.location) LIKE LOWER(CONCAT('%', :location, '%')))
        AND (:type IS NULL OR p.type = :type)
        AND (:bhk IS NULL OR p.bhkType = :bhk)
        AND (:minRent IS NULL OR p.expectedRent >= :minRent)
        AND (:maxRent IS NULL OR p.expectedRent <= :maxRent)
        AND (:furnishing IS NULL OR p.furnishing = :furnishing)
        ORDER BY p.postedOn DESC
        """)
    Page<Property> searchProperties(
        String city,
        String location,
        com.Flatery.model.property.enums.PropertyType type,
        com.Flatery.model.property.enums.BhkType bhk,
        Integer minRent,
        Integer maxRent,
        com.Flatery.model.property.enums.Furnishing furnishing,
        Pageable pageable
    );
}
