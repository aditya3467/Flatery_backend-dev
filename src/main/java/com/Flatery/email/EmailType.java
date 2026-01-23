package com.Flatery.email;

public enum EmailType {
    // Auth
    PASSWORD_RESET,
    OTP_RESET_PASSWORD,

    // Tenant Lifecycle
    TENANT_ONBOARDING,
    TENANT_WELCOME,
    TENANT_CREDS,

    // Rent & Payment
    RENT_DUE_REMINDER,
    RENT_OVERDUE,
    PAYMENT_CONFIRMATION,
    
    // Payment Submission & Verification (New)
    PAYMENT_SUBMISSION,           // Tenant submits payment, owner gets notified
    PAYMENT_APPROVED,             // Owner approves payment, tenant gets notified
    PAYMENT_REJECTED,             // Owner rejects payment, tenant gets notified
    PAYMENT_REMINDER,             // Owner reminds tenant about pending payment
    
    // Maintenance & Complaints (New)
    MAINTENANCE_REQUEST_SUBMITTED,// Tenant submits complaint, owner gets notified
    MAINTENANCE_REQUEST_ACKNOWLEDGED, // Owner acknowledges, tenant gets notified
    MAINTENANCE_REQUEST_RESOLVED, // Issue resolved, tenant gets notified

    // System
    LISTING_APPROVED,
    LISTING_BLOCKED
}
