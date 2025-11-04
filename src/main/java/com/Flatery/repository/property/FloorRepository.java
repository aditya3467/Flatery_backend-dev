package com.Flatery.repository.property;

import com.Flatery.model.property.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByPropertyIdOrderByNumberAsc(Long propertyId);
    boolean existsByPropertyIdAndNumber(Long propertyId, Integer number);
}
