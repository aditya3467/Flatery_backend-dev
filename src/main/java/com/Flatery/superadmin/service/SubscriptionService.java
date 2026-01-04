package com.Flatery.superadmin.service;

import com.Flatery.model.User;
import com.Flatery.repository.UserRepository;
import com.Flatery.superadmin.dto.SubscriptionPlanDto;
import com.Flatery.superadmin.dto.UserSubscriptionDto;
import com.Flatery.superadmin.model.SubscriptionPlan;
import com.Flatery.superadmin.model.UserSubscription;
import com.Flatery.superadmin.repository.SubscriptionPlanRepository;
import com.Flatery.superadmin.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing subscription plans and user subscriptions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {
    
    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    
    /**
     * Get all subscription plans
     */
    public List<SubscriptionPlanDto> getAllPlans() {
        log.info("Fetching all subscription plans");
        return planRepository.findAll().stream()
                .map(this::convertToPlanDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get active subscription plans
     */
    public List<SubscriptionPlanDto> getActivePlans() {
        log.info("Fetching active subscription plans");
        return planRepository.findByIsActiveTrue().stream()
                .map(this::convertToPlanDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Create or update subscription plan
     */
    @Transactional
    public SubscriptionPlanDto savePlan(SubscriptionPlan plan) {
        log.info("Saving subscription plan: {}", plan.getPlanName());
        SubscriptionPlan saved = planRepository.save(plan);
        return convertToPlanDto(saved);
    }
    
    /**
     * Delete subscription plan
     */
    @Transactional
    public void deletePlan(Long planId) {
        log.info("Deleting subscription plan ID: {}", planId);
        planRepository.deleteById(planId);
    }
    
    /**
     * Get all user subscriptions with pagination
     */
    public Page<UserSubscriptionDto> getAllSubscriptions(Pageable pageable) {
        log.info("Fetching all user subscriptions with pagination");
        return subscriptionRepository.findAll(pageable)
                .map(this::convertToSubscriptionDto);
    }
    
    /**
     * Get subscriptions by status
     */
    public Page<UserSubscriptionDto> getSubscriptionsByStatus(
            UserSubscription.SubscriptionStatus status, 
            Pageable pageable
    ) {
        log.info("Fetching subscriptions by status: {}", status);
        return subscriptionRepository.findByStatus(status, pageable)
                .map(this::convertToSubscriptionDto);
    }
    
    /**
     * Get user subscription
     */
    public UserSubscriptionDto getUserSubscription(Long userId) {
        log.info("Fetching subscription for user ID: {}", userId);
        return subscriptionRepository.findByUserIdAndStatus(userId, UserSubscription.SubscriptionStatus.ACTIVE)
                .map(this::convertToSubscriptionDto)
                .orElse(null);
    }
    
    /**
     * Create user subscription
     */
    @Transactional
    public UserSubscriptionDto createSubscription(Long userId, Long planId, Boolean isYearly) {
        log.info("Creating subscription for user ID {} with plan ID {}", userId, planId);
        
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        
        // Cancel existing active subscription
        subscriptionRepository.findByUserIdAndStatus(userId, UserSubscription.SubscriptionStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
                    subscriptionRepository.save(existing);
                });
        
        // Create new subscription
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = isYearly ? startDate.plusYears(1) : startDate.plusMonths(1);
        
        UserSubscription subscription = UserSubscription.builder()
                .userId(userId)
                .plan(plan)
                .status(UserSubscription.SubscriptionStatus.ACTIVE)
                .startDate(startDate)
                .endDate(endDate)
                .autoRenew(false)
                .build();
        
        UserSubscription saved = subscriptionRepository.save(subscription);
        return convertToSubscriptionDto(saved);
    }
    
    /**
     * Cancel user subscription
     */
    @Transactional
    public void cancelSubscription(Long subscriptionId) {
        log.info("Cancelling subscription ID: {}", subscriptionId);
        UserSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        
        subscription.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
        subscription.setAutoRenew(false);
        subscriptionRepository.save(subscription);
    }
    
    /**
     * Check and update expired subscriptions
     */
    @Transactional
    public void checkExpiredSubscriptions() {
        log.info("Checking for expired subscriptions");
        LocalDateTime now = LocalDateTime.now();
        List<UserSubscription> expiredSubscriptions = subscriptionRepository
                .findByEndDateBeforeAndStatus(now, UserSubscription.SubscriptionStatus.ACTIVE);
        
        expiredSubscriptions.forEach(subscription -> {
            subscription.setStatus(UserSubscription.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            log.info("Expired subscription ID {} for user ID {}", subscription.getId(), subscription.getUserId());
        });
    }
    
    /**
     * Convert SubscriptionPlan to DTO
     */
    private SubscriptionPlanDto convertToPlanDto(SubscriptionPlan plan) {
        long subscriberCount = subscriptionRepository.findAll().stream()
                .filter(sub -> sub.getPlan().getId().equals(plan.getId()))
                .filter(sub -> sub.getStatus() == UserSubscription.SubscriptionStatus.ACTIVE)
                .count();
        
        return SubscriptionPlanDto.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .priceMonthly(plan.getPriceMonthly())
                .priceYearly(plan.getPriceYearly())
                .maxProperties(plan.getMaxProperties())
                .maxTenants(plan.getMaxTenants())
                .maxImages(plan.getMaxImages())
                .allowPremiumSupport(plan.getAllowPremiumSupport())
                .allowAnalytics(plan.getAllowAnalytics())
                .allowCustomBranding(plan.getAllowCustomBranding())
                .isActive(plan.getIsActive())
                .totalSubscribers(subscriberCount)
                .build();
    }
    
    /**
     * Convert UserSubscription to DTO
     */
    private UserSubscriptionDto convertToSubscriptionDto(UserSubscription subscription) {
        User user = userRepository.findById(subscription.getUserId()).orElse(null);
        
        long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), subscription.getEndDate());
        
        return UserSubscriptionDto.builder()
                .id(subscription.getId())
                .userId(subscription.getUserId())
                .username(user != null ? user.getUsername() : "Unknown")
                .userEmail(user != null ? user.getEmail() : "N/A")
                .planName(subscription.getPlan().getPlanName())
                .status(subscription.getStatus())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .autoRenew(subscription.getAutoRenew())
                .transactionId(subscription.getTransactionId())
                .daysRemaining((int) Math.max(0, daysRemaining))
                .build();
    }
}
