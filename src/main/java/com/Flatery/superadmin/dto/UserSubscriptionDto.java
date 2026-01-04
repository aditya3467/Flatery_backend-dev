package com.Flatery.superadmin.dto;

import com.Flatery.superadmin.model.UserSubscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for user subscription
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscriptionDto {
    private Long id;
    private Long userId;
    private String username;
    private String userEmail;
    private String planName;
    private UserSubscription.SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean autoRenew;
    private String transactionId;
    private Integer daysRemaining;
}
