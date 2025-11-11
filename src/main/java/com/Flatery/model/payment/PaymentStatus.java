package com.Flatery.model.payment;

public enum PaymentStatus {
    PENDING,
    VERIFIED,
    REJECTED,
    CANCELED  // Tenant withdrew/canceled their submission
}
