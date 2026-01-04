package com.Flatery.superadmin.service;

import com.Flatery.superadmin.model.SubscriptionPlan;
import com.Flatery.superadmin.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service to initialize default subscription plans on application startup
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlanInitializationService implements CommandLineRunner {
    
    private final SubscriptionPlanRepository planRepository;
    
    @Override
    public void run(String... args) {
        initializeDefaultPlans();
    }
    
    /**
     * Initialize default subscription plans if they don't exist
     */
    private void initializeDefaultPlans() {
        try {
            if (planRepository.count() == 0) {
                log.info("Initializing default subscription plans...");
                
                // FREE Plan
                if (!planRepository.existsByPlanName("FREE")) {
                    SubscriptionPlan freePlan = SubscriptionPlan.builder()
                            .planName("FREE")
                            .description("Perfect for getting started with basic property management")
                            .priceMonthly(0.0)
                            .priceYearly(0.0)
                            .maxProperties(2)
                            .maxTenants(5)
                            .maxImages(10)
                            .allowPremiumSupport(false)
                            .allowAnalytics(false)
                            .allowCustomBranding(false)
                            .isActive(true)
                            .build();
                    freePlan.setCreatedAt(LocalDateTime.now());
                    planRepository.save(freePlan);
                    log.info("Created FREE plan");
                }
                
                // BASIC Plan
                if (!planRepository.existsByPlanName("BASIC")) {
                    SubscriptionPlan basicPlan = SubscriptionPlan.builder()
                            .planName("BASIC")
                            .description("Ideal for small property owners managing multiple properties")
                            .priceMonthly(499.0)
                            .priceYearly(4999.0)
                            .maxProperties(10)
                            .maxTenants(25)
                            .maxImages(50)
                            .allowPremiumSupport(false)
                            .allowAnalytics(true)
                            .allowCustomBranding(false)
                            .isActive(true)
                            .build();
                    basicPlan.setCreatedAt(LocalDateTime.now());
                    planRepository.save(basicPlan);
                    log.info("Created BASIC plan");
                }
                
                // PREMIUM Plan
                if (!planRepository.existsByPlanName("PREMIUM")) {
                    SubscriptionPlan premiumPlan = SubscriptionPlan.builder()
                            .planName("PREMIUM")
                            .description("Best for professional property managers with extensive portfolios")
                            .priceMonthly(1499.0)
                            .priceYearly(14999.0)
                            .maxProperties(50)
                            .maxTenants(100)
                            .maxImages(200)
                            .allowPremiumSupport(true)
                            .allowAnalytics(true)
                            .allowCustomBranding(true)
                            .isActive(true)
                            .build();
                    premiumPlan.setCreatedAt(LocalDateTime.now());
                    planRepository.save(premiumPlan);
                    log.info("Created PREMIUM plan");
                }
                
                // ENTERPRISE Plan
                if (!planRepository.existsByPlanName("ENTERPRISE")) {
                    SubscriptionPlan enterprisePlan = SubscriptionPlan.builder()
                            .planName("ENTERPRISE")
                            .description("Unlimited access for large property management companies")
                            .priceMonthly(4999.0)
                            .priceYearly(49999.0)
                            .maxProperties(999)
                            .maxTenants(9999)
                            .maxImages(9999)
                            .allowPremiumSupport(true)
                            .allowAnalytics(true)
                            .allowCustomBranding(true)
                            .isActive(true)
                            .build();
                    enterprisePlan.setCreatedAt(LocalDateTime.now());
                    planRepository.save(enterprisePlan);
                    log.info("Created ENTERPRISE plan");
                }
                
                log.info("Default subscription plans initialized successfully");
            } else {
                log.info("Subscription plans already exist, skipping initialization");
            }
        } catch (Exception e) {
            log.error("Failed to initialize default subscription plans", e);
        }
    }
}
