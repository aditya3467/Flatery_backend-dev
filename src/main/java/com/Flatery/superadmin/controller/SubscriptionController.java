package com.Flatery.superadmin.controller;

import com.Flatery.superadmin.dto.SubscriptionPlanDto;
import com.Flatery.superadmin.dto.UserSubscriptionDto;
import com.Flatery.superadmin.model.SubscriptionPlan;
import com.Flatery.superadmin.model.UserSubscription;
import com.Flatery.superadmin.security.SuperAdminGuard;
import com.Flatery.superadmin.service.AuditLogService;
import com.Flatery.superadmin.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for SuperAdmin Subscription Management
 */
@RestController
@RequestMapping("/api/superadmin/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {
    
    private final SubscriptionService subscriptionService;
    private final AuditLogService auditLogService;
    
    /**
     * Get all subscription plans
     */
    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanDto>> getAllPlans(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching all subscription plans", userDetails.getUsername());
        
        List<SubscriptionPlanDto> plans = subscriptionService.getAllPlans();
        return ResponseEntity.ok(plans);
    }
    
    /**
     * Get active subscription plans
     */
    @GetMapping("/plans/active")
    public ResponseEntity<List<SubscriptionPlanDto>> getActivePlans(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching active subscription plans", userDetails.getUsername());
        
        List<SubscriptionPlanDto> plans = subscriptionService.getActivePlans();
        return ResponseEntity.ok(plans);
    }
    
    /**
     * Create or update subscription plan
     */
    @PostMapping("/plans")
    public ResponseEntity<SubscriptionPlanDto> savePlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SubscriptionPlan plan
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} saving subscription plan: {}", userDetails.getUsername(), plan.getPlanName());
        
        SubscriptionPlanDto savedPlan = subscriptionService.savePlan(plan);
        
        auditLogService.log(
                userDetails.getUsername(),
                plan.getId() == null ? "CREATE_PLAN" : "UPDATE_PLAN",
                "SubscriptionPlan",
                savedPlan.getId(),
                "Saved subscription plan: " + savedPlan.getPlanName()
        );
        
        return ResponseEntity.ok(savedPlan);
    }
    
    /**
     * Delete subscription plan
     */
    @DeleteMapping("/plans/{planId}")
    public ResponseEntity<Void> deletePlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long planId
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} deleting subscription plan ID: {}", userDetails.getUsername(), planId);
        
        subscriptionService.deletePlan(planId);
        
        auditLogService.log(
                userDetails.getUsername(),
                "DELETE_PLAN",
                "SubscriptionPlan",
                planId,
                "Deleted subscription plan"
        );
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get all user subscriptions
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserSubscriptionDto>> getAllSubscriptions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching user subscriptions", userDetails.getUsername());
        
        Sort sort = sortDir.equalsIgnoreCase("DESC") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<UserSubscriptionDto> subscriptions = subscriptionService.getAllSubscriptions(pageable);
        return ResponseEntity.ok(subscriptions);
    }
    
    /**
     * Get subscriptions by status
     */
    @GetMapping("/users/status/{status}")
    public ResponseEntity<Page<UserSubscriptionDto>> getSubscriptionsByStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UserSubscription.SubscriptionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} fetching subscriptions by status: {}", userDetails.getUsername(), status);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserSubscriptionDto> subscriptions = subscriptionService.getSubscriptionsByStatus(status, pageable);
        
        return ResponseEntity.ok(subscriptions);
    }
    
    /**
     * Create user subscription
     */
    @PostMapping("/users/{userId}")
    public ResponseEntity<UserSubscriptionDto> createSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId,
            @RequestParam Long planId,
            @RequestParam(defaultValue = "false") Boolean isYearly
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} creating subscription for user ID {}", userDetails.getUsername(), userId);
        
        UserSubscriptionDto subscription = subscriptionService.createSubscription(userId, planId, isYearly);
        
        auditLogService.log(
                userDetails.getUsername(),
                "CREATE_SUBSCRIPTION",
                "UserSubscription",
                subscription.getId(),
                "Created subscription for user ID " + userId
        );
        
        return ResponseEntity.ok(subscription);
    }
    
    /**
     * Cancel user subscription
     */
    @PutMapping("/{subscriptionId}/cancel")
    public ResponseEntity<Void> cancelSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long subscriptionId
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} cancelling subscription ID: {}", userDetails.getUsername(), subscriptionId);
        
        subscriptionService.cancelSubscription(subscriptionId);
        
        auditLogService.log(
                userDetails.getUsername(),
                "CANCEL_SUBSCRIPTION",
                "UserSubscription",
                subscriptionId,
                "Cancelled user subscription"
        );
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Check and update expired subscriptions
     */
    @PostMapping("/check-expired")
    public ResponseEntity<Void> checkExpiredSubscriptions(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SuperAdminGuard.requireSuperAdmin(userDetails);
        log.info("SuperAdmin {} checking for expired subscriptions", userDetails.getUsername());
        
        subscriptionService.checkExpiredSubscriptions();
        
        auditLogService.log(
                userDetails.getUsername(),
                "CHECK_EXPIRED_SUBSCRIPTIONS",
                "System",
                null,
                "Checked and updated expired subscriptions"
        );
        
        return ResponseEntity.noContent().build();
    }
}
