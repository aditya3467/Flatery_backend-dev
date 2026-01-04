package com.Flatery.repository.property;

import com.Flatery.model.property.PropertyView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyViewRepository extends JpaRepository<PropertyView, Long> {

    // Check if user already viewed this property today
    @Query("SELECT COUNT(v) > 0 FROM PropertyView v WHERE v.propertyId = :propertyId " +
           "AND v.userId = :userId AND v.viewedAt >= :since")
    boolean existsByPropertyIdAndUserIdAndViewedAtAfter(
            @Param("propertyId") Long propertyId,
            @Param("userId") Long userId,
            @Param("since") LocalDateTime since
    );

    // Check if guest session already viewed this property today
    @Query("SELECT COUNT(v) > 0 FROM PropertyView v WHERE v.propertyId = :propertyId " +
           "AND v.sessionId = :sessionId AND v.viewedAt >= :since")
    boolean existsByPropertyIdAndSessionIdAndViewedAtAfter(
            @Param("propertyId") Long propertyId,
            @Param("sessionId") String sessionId,
            @Param("since") LocalDateTime since
    );

    // Get views for a property in a date range
    @Query("SELECT v FROM PropertyView v WHERE v.propertyId = :propertyId " +
           "AND v.viewedAt BETWEEN :startDate AND :endDate " +
           "AND v.ownerView = false")
    List<PropertyView> findByPropertyIdAndViewedAtBetween(
            @Param("propertyId") Long propertyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Count total views for a property
    @Query("SELECT COUNT(v) FROM PropertyView v WHERE v.propertyId = :propertyId AND v.ownerView = false")
    long countByPropertyId(@Param("propertyId") Long propertyId);

    // Count unique users who viewed a property
    @Query("SELECT COUNT(DISTINCT v.userId) FROM PropertyView v WHERE v.propertyId = :propertyId " +
           "AND v.userId IS NOT NULL AND v.ownerView = false")
    long countUniqueUsersByPropertyId(@Param("propertyId") Long propertyId);

    // Get recent views for aggregation
    @Query("SELECT v FROM PropertyView v WHERE v.viewedAt >= :since AND v.ownerView = false")
    List<PropertyView> findRecentViews(@Param("since") LocalDateTime since);
    
    // Count views after a certain date (for superadmin dashboard)
    long countByViewedAtAfter(LocalDateTime date);
}

