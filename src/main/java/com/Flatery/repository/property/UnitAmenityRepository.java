package com.Flatery.repository.property;

import com.Flatery.model.property.UnitAmenity;
import com.Flatery.model.property.UnitAmenityId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitAmenityRepository extends JpaRepository<UnitAmenity, UnitAmenityId> {
    List<UnitAmenity> findByUnitId(Long unitId);
}
