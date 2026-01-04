package com.Flatery.superadmin.repository;

import com.Flatery.superadmin.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByPlanName(String planName);
    List<SubscriptionPlan> findByIsActiveTrue();
    boolean existsByPlanName(String planName);
}
