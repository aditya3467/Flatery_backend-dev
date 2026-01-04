package com.Flatery.superadmin.repository;

import com.Flatery.superadmin.model.UserSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUserIdAndStatus(Long userId, UserSubscription.SubscriptionStatus status);
    List<UserSubscription> findByUserId(Long userId);
    Page<UserSubscription> findByStatus(UserSubscription.SubscriptionStatus status, Pageable pageable);
    List<UserSubscription> findByEndDateBeforeAndStatus(LocalDateTime date, UserSubscription.SubscriptionStatus status);
    
    @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.status = :status")
    long countByStatus(UserSubscription.SubscriptionStatus status);
}
