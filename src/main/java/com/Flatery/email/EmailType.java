package com.Flatery.email;

public enum EmailType {
    // Auth
    PASSWORD_RESET,

    // Tenant Lifecycle
    TENANT_ONBOARDING,
    TENANT_WELCOME,

    // Rent & Payment
    RENT_DUE_REMINDER,
    RENT_OVERDUE,
    PAYMENT_CONFIRMATION,

    // System
    LISTING_APPROVED,
    LISTING_BLOCKED
}
