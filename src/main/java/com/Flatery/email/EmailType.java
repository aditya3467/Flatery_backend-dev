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

    // System
    LISTING_APPROVED,
    LISTING_BLOCKED
}
