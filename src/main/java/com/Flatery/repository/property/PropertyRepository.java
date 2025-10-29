package com.Flatery.repository.property;

import com.Flatery.model.property.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PropertyRepository extends JpaRepository<Property, Long> {

    Page<Property> findByOwnerId(Long ownerId, Pageable pageable);

    Optional<Property> findByIdAndOwnerId(Long id, Long ownerId);
}
