package com.Flatery.repository.property;

import com.Flatery.model.property.AmenityMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AmenityMasterRepository extends JpaRepository<AmenityMaster, Long> {
    Optional<AmenityMaster> findByCode(String code);
}
