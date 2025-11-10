package com.Flatery.repository.property;

import com.Flatery.model.property.Unit;
import com.Flatery.model.property.enums.UnitStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitRepository extends JpaRepository<Unit, Long> {
    List<Unit> findByPropertyId(Long propertyId);
    List<Unit> findByFloorId(Long floorId);
    long countByFloorId(Long floorId);
    long countByPropertyIdAndStatus(Long propertyId, UnitStatus status);
    boolean existsByFloorIdAndCode(Long floorId, String code);
}
