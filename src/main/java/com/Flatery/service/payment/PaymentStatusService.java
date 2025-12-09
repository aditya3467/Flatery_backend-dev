package com.Flatery.service.payment;

import com.Flatery.model.payment.PaymentStatus;
import com.Flatery.model.payment.TenantMonthlyPaymentStatus;
import com.Flatery.model.payment.Transaction;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.payment.TenantMonthlyPaymentStatusRepository;
import com.Flatery.repository.payment.TransactionRepository;
import com.Flatery.repository.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentStatusService {

    private final TenantMonthlyPaymentStatusRepository monthlyPaymentStatusRepository;
    private final TransactionRepository transactionRepository;
    private final TenantRepository tenantRepository;

    /**
     * Calculate the next rent due date for a tenant based on payment history
     * If current month is paid, return rentDueDate of next month
     * If current month is unpaid, return rentDueDate of current month
     */
    public LocalDate calculateNextDueDate(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        if (tenant.getRentDueDate() == null) {
            return null;
        }

        String currentMonth = getCurrentMonthString();
        boolean isCurrentMonthPaid = isMonthPaid(tenantId, currentMonth);

        LocalDate now = LocalDate.now();
        int dueDay = tenant.getRentDueDate();

        if (isCurrentMonthPaid) {
            // Current month paid, next due date is in next month
            YearMonth nextMonth = YearMonth.from(now).plusMonths(1);
            return calculateDueDateForMonth(nextMonth, dueDay);
        } else {
            // Current month unpaid, due date is in current month
            YearMonth currentYearMonth = YearMonth.from(now);
            LocalDate dueDate = calculateDueDateForMonth(currentYearMonth, dueDay);
            
            // If due date has passed in current month, it's overdue
            if (dueDate.isBefore(now)) {
                return dueDate; // Still return current month's date to show it's overdue
            }
            return dueDate;
        }
    }

    /**
     * Get payment status for a tenant for a specific month
     */
    public boolean isMonthPaid(Long tenantId, String paymentMonth) {
        // Check monthly payment status table first
        Optional<TenantMonthlyPaymentStatus> status = monthlyPaymentStatusRepository
                .findByTenantIdAndPaymentMonth(tenantId, paymentMonth);

        if (status.isPresent() && status.get().isPaid()) {
            return true;
        }

        // Also check if there's a VERIFIED transaction for this month
        List<Transaction> transactions = transactionRepository
                .findByTenantIdAndPaymentMonth(tenantId, paymentMonth);

        return transactions.stream()
                .anyMatch(t -> t.getStatus() == PaymentStatus.VERIFIED);
    }

    /**
     * Check if rent is overdue for a tenant
     */
    public boolean isRentOverdue(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        if (tenant.getRentDueDate() == null) {
            return false;
        }

        String currentMonth = getCurrentMonthString();
        
        // If current month is not paid and due date has passed
        if (!isMonthPaid(tenantId, currentMonth)) {
            LocalDate now = LocalDate.now();
            int dueDay = tenant.getRentDueDate();
            YearMonth currentYearMonth = YearMonth.from(now);
            LocalDate dueDate = calculateDueDateForMonth(currentYearMonth, dueDay);
            
            return now.isAfter(dueDate);
        }

        return false;
    }

    /**
     * Get payment history for a tenant
     */
    public List<Map<String, Object>> getPaymentHistory(Long tenantId, int months) {
        List<Map<String, Object>> history = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.from(now).minusMonths(i);
            String monthString = yearMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthString);
            monthData.put("isPaid", isMonthPaid(tenantId, monthString));
            
            // Get transaction details if paid
            List<Transaction> transactions = transactionRepository
                    .findByTenantIdAndPaymentMonth(tenantId, monthString);
            
            Optional<Transaction> verifiedTransaction = transactions.stream()
                    .filter(t -> t.getStatus() == PaymentStatus.VERIFIED)
                    .findFirst();

            if (verifiedTransaction.isPresent()) {
                Transaction txn = verifiedTransaction.get();
                monthData.put("amount", txn.getAmount());
                monthData.put("paymentDate", txn.getPaymentDate());
                monthData.put("paymentMode", txn.getPaymentMode());
                monthData.put("transactionId", txn.getId());
            }

            history.add(monthData);
        }

        return history;
    }

    /**
     * Mark a month as paid manually (for owner use)
     */
    @Transactional
    public void markMonthAsPaid(Long tenantId, String paymentMonth, String markedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        Optional<TenantMonthlyPaymentStatus> existing = monthlyPaymentStatusRepository
                .findByTenantIdAndPaymentMonth(tenantId, paymentMonth);

        if (existing.isPresent()) {
            TenantMonthlyPaymentStatus status = existing.get();
            status.setPaid(true);
            status.setMarkedPaidDate(LocalDateTime.now());
            status.setMarkedBy(markedBy);
            monthlyPaymentStatusRepository.save(status);
        } else {
            TenantMonthlyPaymentStatus newStatus = TenantMonthlyPaymentStatus.builder()
                    .tenantId(tenantId)
                    .propertyId(tenant.getPropertyId())
                    .paymentMonth(paymentMonth)
                    .isPaid(true)
                    .markedPaidDate(LocalDateTime.now())
                    .markedBy(markedBy)
                    .build();
            monthlyPaymentStatusRepository.save(newStatus);
        }
    }

    /**
     * Mark a month as unpaid (undo payment)
     */
    @Transactional
    public void markMonthAsUnpaid(Long tenantId, String paymentMonth) {
        Optional<TenantMonthlyPaymentStatus> existing = monthlyPaymentStatusRepository
                .findByTenantIdAndPaymentMonth(tenantId, paymentMonth);

        existing.ifPresent(status -> {
            status.setPaid(false);
            status.setMarkedPaidDate(null);
            status.setMarkedBy(null);
            monthlyPaymentStatusRepository.save(status);
        });
    }

    /**
     * Get all tenants with overdue payments for a property
     */
    public List<Long> getOverdueTenants(Long propertyId) {
        List<Tenant> tenants = tenantRepository.findByPropertyId(propertyId);
        
        return tenants.stream()
                .filter(t -> t.getStatus() == Tenant.TenantStatus.ACTIVE)
                .filter(t -> isRentOverdue(t.getId()))
                .map(Tenant::getId)
                .collect(Collectors.toList());
    }

    /**
     * Get payment status summary for all tenants in a property
     */
    public List<Map<String, Object>> getPropertyPaymentSummary(Long propertyId, String month) {
        List<Tenant> tenants = tenantRepository.findByPropertyId(propertyId);
        
        return tenants.stream()
                .filter(t -> t.getStatus() == Tenant.TenantStatus.ACTIVE)
                .map(tenant -> {
                    Map<String, Object> summary = new HashMap<>();
                    summary.put("tenantId", tenant.getId());
                    summary.put("tenantName", tenant.getTenantName());
                    summary.put("rentAmount", tenant.getRentAmount());
                    summary.put("isPaid", isMonthPaid(tenant.getId(), month));
                    summary.put("isOverdue", isRentOverdue(tenant.getId()));
                    summary.put("nextDueDate", calculateNextDueDate(tenant.getId()));
                    return summary;
                })
                .collect(Collectors.toList());
    }

    // Helper methods
    private String getCurrentMonthString() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private LocalDate calculateDueDateForMonth(YearMonth yearMonth, int dueDay) {
        // Handle months with fewer days than the due day
        int actualDay = Math.min(dueDay, yearMonth.lengthOfMonth());
        return yearMonth.atDay(actualDay);
    }

    /**
     * Get detailed payment status for a tenant
     */
    public Map<String, Object> getTenantPaymentStatus(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        String currentMonth = getCurrentMonthString();
        boolean isCurrentMonthPaid = isMonthPaid(tenantId, currentMonth);
        boolean isOverdue = isRentOverdue(tenantId);
        LocalDate nextDueDate = calculateNextDueDate(tenantId);

        Map<String, Object> status = new HashMap<>();
        status.put("tenantId", tenantId);
        status.put("tenantName", tenant.getTenantName());
        status.put("rentAmount", tenant.getRentAmount());
        status.put("rentDueDate", tenant.getRentDueDate());
        status.put("currentMonth", currentMonth);
        status.put("isCurrentMonthPaid", isCurrentMonthPaid);
        status.put("isOverdue", isOverdue);
        status.put("nextDueDate", nextDueDate);
        status.put("paymentHistory", getPaymentHistory(tenantId, 6)); // Last 6 months

        return status;
    }
}
