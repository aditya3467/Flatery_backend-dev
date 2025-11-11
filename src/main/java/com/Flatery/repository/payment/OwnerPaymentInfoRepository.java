package com.Flatery.repository.payment;

import com.Flatery.model.payment.OwnerPaymentInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerPaymentInfoRepository extends JpaRepository<OwnerPaymentInfo, Long> {

    Optional<OwnerPaymentInfo> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);
}
