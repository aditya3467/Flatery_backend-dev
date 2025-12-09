package com.Flatery.service.payment;

import com.Flatery.dto.payment.PaymentRequestDto;
import com.Flatery.dto.payment.TransactionResponseDto;
import com.Flatery.model.Notification;
import com.Flatery.model.User;
import com.Flatery.model.payment.PaymentMode;
import com.Flatery.model.payment.PaymentStatus;
import com.Flatery.model.payment.Transaction;
import com.Flatery.model.payment.TenantMonthlyPaymentStatus;
import com.Flatery.model.tenant.Tenant;
import com.Flatery.repository.payment.TransactionRepository;
import com.Flatery.repository.payment.TenantMonthlyPaymentStatusRepository;
import com.Flatery.repository.tenant.TenantRepository;
import com.Flatery.repository.UserRepository;
import com.Flatery.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository repository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TenantMonthlyPaymentStatusRepository monthlyPaymentStatusRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private final PlatformTransactionManager transactionManager;

    public TransactionService(TransactionRepository repository, TenantRepository tenantRepository, 
                            UserRepository userRepository, NotificationService notificationService, 
                            PlatformTransactionManager transactionManager,
                            TenantMonthlyPaymentStatusRepository monthlyPaymentStatusRepository) {
        this.repository = repository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.transactionManager = transactionManager;
        this.monthlyPaymentStatusRepository = monthlyPaymentStatusRepository;
    }

    public Transaction save(Transaction transaction) {
        return repository.save(transaction);
    }

    public List<Transaction> findByTenantId(Long tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public List<Transaction> findByOwnerIdAndStatus(Long ownerId, PaymentStatus status) {
        return repository.findByOwnerIdAndStatus(ownerId, status);
    }

    public Optional<Transaction> findById(Long id) {
        return repository.findById(id);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * Helper method to resolve User ID from Tenant ID for notifications
     * The transaction.tenantId refers to the Tenant entity's ID, but notifications need User ID
     */
    private Long resolveUserIdFromTenantId(Long tenantId) {
        try {
            // First, get the Tenant entity by ID
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isEmpty()) {
                System.err.println("Tenant not found for ID: " + tenantId);
                return null;
            }
            
            Tenant tenant = tenantOpt.get();
            String tenantPhoneNumber = tenant.getPhoneNumber();
            
            // Now find the User with matching phone number
            Optional<User> userOpt = userRepository.findByPhoneNumber(tenantPhoneNumber);
            if (userOpt.isEmpty()) {
                System.err.println("User not found for tenant phone number: " + tenantPhoneNumber);
                return null;
            }
            
            Long userId = userOpt.get().getId();
            System.out.println("Resolved tenant ID " + tenantId + " to user ID " + userId + " via phone " + tenantPhoneNumber);
            return userId;
            
        } catch (Exception e) {
            System.err.println("Error resolving user ID from tenant ID " + tenantId + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * Create transaction for manual payment modes (UPI, CASH, BANK_TRANSFER) only.
     * Validates the payment mode and maps DTO to entity.
     * Sends notification to owner when tenant submits a payment.
     */
    @Transactional
    public TransactionResponseDto createManualPayment(PaymentRequestDto dto, Long tenantId, Long ownerId, Long propertyId) {
        String modeStr = dto.getPaymentMode().toUpperCase();
        if (!(modeStr.equals("UPI") || modeStr.equals("CASH") || modeStr.equals("BANK_TRANSFER"))) {
            throw new IllegalArgumentException("Only manual payment modes: UPI, CASH, or BANK_TRANSFER are supported.");
        }
        PaymentMode paymentMode = PaymentMode.valueOf(modeStr);

        Transaction transaction = Transaction.builder()
                .tenantId(tenantId)
                .ownerId(ownerId)
                .propertyId(propertyId)
                .amount(dto.getAmount())
                .paymentMonth(dto.getPaymentMonth())
                .paymentMode(paymentMode)
                .upiRef(dto.getUpiRef())
                .screenshotUrl(dto.getScreenshotUrl())
                .status(PaymentStatus.PENDING)
                .createdBy("tenant-" + tenantId)
                .updatedBy("tenant-" + tenantId)
                .build();

        Transaction saved = repository.save(transaction);
        
        // Send notification to owner about new payment submission
        try {
            String title = "New Payment Submitted 💰";
            String message = String.format("Tenant has submitted a payment of ₹%.2f for %s via %s. Please review and approve.", 
                saved.getAmount(), 
                saved.getPaymentMonth(),
                saved.getPaymentMode().toString().replace("_", " ")
            );
            String redirectUrl = "/owner/Owner.html"; // Redirect to owner dashboard
            
            notificationService.createNotification(
                ownerId,                   // userId (recipient - owner)
                tenantId,                  // senderId (tenant who submitted)
                "PaymentSubmitted",        // type
                title,                     // title
                message,                   // message
                redirectUrl                // redirectUrl
            );
            
            System.out.println("Payment submission notification sent to owner ID: " + ownerId);
        } catch (Exception e) {
            System.err.println("Failed to send payment submission notification: " + e.getMessage());
            // Don't fail the transaction if notification fails
        }
        
        return mapToDto(saved);
    }

    /**
     * Owner creates a pre-approved payment (e.g., initial rent received during tenant onboarding)
     */
    @Transactional
    public TransactionResponseDto createOwnerApprovedPayment(PaymentRequestDto dto, Long ownerId) {
        // Validate tenant exists and belongs to this owner
        Tenant tenant = tenantRepository.findById(dto.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        
        if (!tenant.getOwnerId().equals(ownerId)) {
            throw new SecurityException("You don't have permission to create payments for this tenant");
        }
        
        String modeStr = dto.getPaymentMode() != null ? dto.getPaymentMode().toUpperCase() : "CASH";
        PaymentMode paymentMode = PaymentMode.valueOf(modeStr);
        
        // Create transaction with VERIFIED status (pre-approved by owner)
        Transaction transaction = Transaction.builder()
                .tenantId(tenant.getId())
                .ownerId(ownerId)
                .propertyId(tenant.getPropertyId())
                .amount(dto.getAmount())
                .paymentMonth(dto.getPaymentMonth())
                .paymentMode(paymentMode)
                .upiRef(dto.getUpiRef())
                .status(PaymentStatus.VERIFIED)
                .paymentDate(java.time.LocalDateTime.now())
                .createdBy("owner-" + ownerId)
                .updatedBy("owner-" + ownerId)
                .build();
        
        Transaction saved = repository.save(transaction);
        
        // Mark month as paid in monthly payment status
        markMonthAsPaid(tenant.getId(), tenant.getPropertyId(), dto.getPaymentMonth(), "owner-" + ownerId);
        
        System.out.println("Owner-approved payment created: id=" + saved.getId());
        return mapToDto(saved);
    }

    public List<TransactionResponseDto> getTransactionsByOwnerAndStatus(Long ownerId, PaymentStatus status) {
        return repository.findByOwnerIdAndStatus(ownerId, status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<TransactionResponseDto> findDtoById(Long id) {
        return repository.findById(id).map(this::mapToDto);
    }

    public List<TransactionResponseDto> getTransactionsByTenantId(Long tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TransactionResponseDto> getTransactionsByOwnerId(Long ownerId) {
        return repository.findByOwnerId(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Mark payment as VERIFIED, sets paymentDate to now.
     * Checks that the owner owns the transaction.
     * Sends notification to tenant when payment is approved.
     */
    @Transactional
    public TransactionResponseDto verifyTransaction(Long transactionId, Long ownerId) {
        try {
            System.out.println("=== VERIFY TRANSACTION START ===");
        System.out.println("Transaction ID: " + transactionId);
        System.out.println("Owner ID: " + ownerId);
        
        if (transactionId == null) {
            throw new IllegalArgumentException("Transaction ID cannot be null");
        }
        if (ownerId == null) {
            throw new IllegalArgumentException("Owner ID cannot be null");
        }
        
        Transaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        System.out.println("Transaction found - Tenant ID: " + transaction.getTenantId() + 
                          ", Owner ID: " + transaction.getOwnerId() +
                          ", Amount: " + transaction.getAmount() +
                          ", Status: " + transaction.getStatus());

        if (transaction.getOwnerId() == null) {
            throw new IllegalStateException("Transaction owner ID is null");
        }

        if (!transaction.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Unauthorized attempt to verify transaction");
        }

        transaction.setStatus(PaymentStatus.VERIFIED);
        transaction.setPaymentDate(LocalDateTime.now());
        Transaction updated = repository.save(transaction);
        
        System.out.println("Transaction updated to VERIFIED status");
        
        // Send notification to tenant about payment approval
        try {
            System.out.println("Attempting to create notification...");
            
            // Resolve the actual User ID from the Tenant ID
            Long tenantUserId = resolveUserIdFromTenantId(transaction.getTenantId());
            if (tenantUserId == null) {
                System.err.println("Could not resolve User ID from Tenant ID: " + transaction.getTenantId() + ". Skipping notification.");
                System.out.println("Payment verification completed successfully (notification skipped due to user resolution issue)");
                return mapToDto(updated);
            }
            
            String title = "Payment Approved ✅";
            String message = String.format("Your payment of ₹%.2f for %s has been approved and verified by your owner on %s.", 
                transaction.getAmount(), 
                transaction.getPaymentMonth(), // Use paymentMonth instead of paymentDate format
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
            );
            String redirectUrl = "/tenant-dashboard.html"; // Redirect to tenant dashboard
            
            Notification savedNotification = notificationService.createNotification(
                tenantUserId,              // userId (recipient - resolved from tenant)
                ownerId,                   // senderId (owner who approved)
                "PaymentApproved",         // type
                title,                     // title
                message,                   // message
                redirectUrl                // redirectUrl
            );
            
            System.out.println("Payment approval notification sent successfully!");
            System.out.println("Notification ID: " + savedNotification.getId() + 
                             ", Tenant ID: " + transaction.getTenantId() + 
                             ", Resolved User ID: " + tenantUserId);
            System.out.println("Notification details - Title: " + title + ", Message: " + message);
        } catch (Exception e) {
            System.err.println("Failed to send payment approval notification: " + e.getMessage());
            e.printStackTrace(); // Print stack trace for debugging
            // Don't fail the transaction if notification fails
        }
        
        System.out.println("=== VERIFY TRANSACTION END ===");
        TransactionResponseDto result = mapToDto(updated);
        
        // AFTER successful transaction completion, handle multi-tenant logic separately
        handleMultiTenantAfterCompletion(updated);
        
        return result;
        
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in verifyTransaction: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Transaction verification failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Wrapper method to handle multi-tenant payment update in a separate transaction
     * This prevents failures in multi-tenant logic from rolling back the main payment verification
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void handleMultiTenantPaymentUpdateSeparately(Transaction verifiedTransaction) {
        handleMultiTenantPaymentUpdate(verifiedTransaction);
    }
    
    /**
     * Handle multi-tenant logic AFTER main transaction is complete
     * This runs completely separately and cannot affect the main payment verification
     */
    private void handleMultiTenantAfterCompletion(Transaction verifiedTransaction) {
        try {
            System.out.println("=== POST-COMPLETION MULTI-TENANT PROCESSING ===");
            
            // Run this in a completely separate thread to avoid any transaction interference
            new Thread(() -> {
                try {
                    Thread.sleep(100); // Small delay to ensure main transaction is committed
                    
                    System.out.println("Processing multi-tenant payment status for transaction ID: " + verifiedTransaction.getId());
                    
                    // Call the multi-tenant logic in a new transaction context
                    handleMultiTenantPaymentUpdateSeparately(verifiedTransaction);
                    
                    System.out.println("Multi-tenant processing completed successfully");
                    
                } catch (Exception e) {
                    System.err.println("Error in post-completion multi-tenant processing: " + e.getMessage());
                    e.printStackTrace();
                    // This is completely separate - failures here don't affect anything
                }
            }).start();
            
        } catch (Exception e) {
            System.err.println("Error starting multi-tenant background process: " + e.getMessage());
            // Even thread creation failure won't affect main transaction
        }
    }

    /**
     * Mark payment as REJECTED.
     * Checks owner authorization.
     * Sends notification to tenant when payment is rejected.
     */
    @Transactional
    public TransactionResponseDto rejectTransaction(Long transactionId, Long ownerId) {
        Transaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (!transaction.getOwnerId().equals(ownerId)) {
            throw new SecurityException("Unauthorized attempt to reject transaction");
        }

        transaction.setStatus(PaymentStatus.REJECTED);
        Transaction updated = repository.save(transaction);
        
        // Send notification to tenant about payment rejection
        try {
            // Resolve the actual User ID from the Tenant ID
            Long tenantUserId = resolveUserIdFromTenantId(transaction.getTenantId());
            if (tenantUserId == null) {
                throw new RuntimeException("Could not resolve User ID from Tenant ID: " + transaction.getTenantId());
            }
            
            String title = "Payment Rejected ❌";
            String message = String.format("Your payment of ₹%.2f for %s has been rejected. Please contact your owner for more details or submit a new payment.", 
                transaction.getAmount(), 
                transaction.getPaymentMonth() // Use paymentMonth directly instead of formatting createdAt
            );
            String redirectUrl = "/tenant-dashboard.html"; // Redirect to tenant dashboard
            
            notificationService.createNotification(
                tenantUserId,              // userId (recipient - resolved from tenant)
                ownerId,                   // senderId (owner who rejected)
                "PaymentRejected",         // type
                title,                     // title
                message,                   // message
                redirectUrl                // redirectUrl
            );
            
            System.out.println("Payment rejection notification sent successfully!");
            System.out.println("Tenant ID: " + transaction.getTenantId() + 
                             ", Resolved User ID: " + tenantUserId);
        } catch (Exception e) {
            System.err.println("Failed to send payment rejection notification: " + e.getMessage());
            // Don't fail the transaction if notification fails
        }
        
        return mapToDto(updated);
    }

    /**
     * Tenant withdraws/cancels their pending payment submission.
     * Only allowed if status is PENDING.
     */
    @Transactional
    public TransactionResponseDto withdrawTransaction(Long transactionId, Long tenantId) {
        System.out.println("=== Withdraw Transaction Service ===");
        System.out.println("Transaction ID: " + transactionId);
        System.out.println("Tenant ID: " + tenantId);
        
        Transaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        System.out.println("Transaction found: owner=" + transaction.getTenantId() + ", status=" + transaction.getStatus());

        // Verify tenant owns this transaction
        if (!transaction.getTenantId().equals(tenantId)) {
            System.err.println("Unauthorized: Transaction tenant ID (" + transaction.getTenantId() + ") != requesting tenant ID (" + tenantId + ")");
            throw new SecurityException("Unauthorized: This transaction does not belong to you");
        }

        // Only allow withdrawal if status is PENDING
        if (transaction.getStatus() != PaymentStatus.PENDING) {
            String statusLabel = (transaction.getStatus() != null) ? transaction.getStatus().name() : "UNKNOWN";
            System.err.println("Cannot withdraw: Status is " + statusLabel);
            throw new IllegalArgumentException("Cannot withdraw: Payment is already " + statusLabel);
        }

        System.out.println("Setting status to CANCELED");
        transaction.setStatus(PaymentStatus.CANCELED);
        transaction.setUpdatedBy("tenant-" + tenantId);
        
        System.out.println("Saving transaction...");
        String statusValue = transaction.getStatus() != null ? transaction.getStatus().name() : "null";
        if (statusValue.length() > 32) {
            System.err.println("WARNING: status value length (" + statusValue.length() + ") exceeds column size. Value: " + statusValue);
        }
        Transaction updated;
        try {
            updated = repository.save(transaction);
            // Force flush so we catch DB enum/length errors inside this method
            entityManager.flush();
            System.out.println("Transaction withdrawn successfully (CANCELED persisted)");
            System.out.println("====================================");
            return mapToDto(updated);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            boolean enumMismatch = msg.contains("Data truncated for column 'status'") || msg.contains("Incorrect enum value") || msg.toLowerCase().contains("enum");
            if (!enumMismatch) {
                System.err.println("ERROR while saving withdrawn transaction: " + e.getClass().getName() + " -> " + msg);
                throw new IllegalStateException("Failed to withdraw payment due to database error: " + msg, e);
            }
            // ENUM mismatch fallback
            System.err.println("Schema does not accept CANCELED. Falling back to REJECTED + marker.");
            // Detach the current entity from the failed persistence context
            try { entityManager.detach(transaction); } catch (Exception ignored) {}

            // Perform fallback in a new, independent transaction to avoid rollback-only errors
            TransactionTemplate tmpl = new TransactionTemplate(transactionManager);
            tmpl.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            try {
                updated = tmpl.execute(status -> {
                    transaction.setStatus(PaymentStatus.REJECTED);
                    String marker = (transaction.getUpdatedBy() != null ? transaction.getUpdatedBy() + ";" : "") + "withdrawn-by-tenant";
                    transaction.setUpdatedBy(marker);
                    Transaction u = repository.save(transaction);
                    // Ensure DB write happens here
                    entityManager.flush();
                    return u;
                });
                System.out.println("Stored fallback status=REJECTED with withdrawn marker; exposing as CANCELED in API.");
                System.out.println("====================================");
                return mapToDto(updated);
            } catch (Exception e2) {
                System.err.println("Fallback save also failed (REQUIRES_NEW): " + e2.getClass().getName() + " -> " + e2.getMessage());
                throw new IllegalStateException("Failed to withdraw payment. Please alter transactions.status to include 'CANCELED' or convert to VARCHAR(32). Root cause: " + msg, e2);
            }
        }
    }

    /**
     * Maps Transaction entity to response DTO.
     */
    private TransactionResponseDto mapToDto(Transaction tx) {
        // Fetch tenant info to get name and unit
        String tenantName = "Unknown";
        String unitNumber = "N/A";
        
        try {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tx.getTenantId());
            if (tenantOpt.isPresent()) {
                Tenant tenant = tenantOpt.get();
                tenantName = tenant.getTenantName();
                unitNumber = tenant.getFlatRoomNumber() != null ? tenant.getFlatRoomNumber() : "N/A";
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not fetch tenant info for tenantId " + tx.getTenantId() + ": " + e.getMessage());
        }
        
        // Translate legacy fallback (REJECTED + withdrawn marker) to CANCELED for API consumers
        String statusForDto = tx.getStatus() != null ? tx.getStatus().name() : null;
        if (tx.getStatus() == PaymentStatus.REJECTED) {
            String ub = tx.getUpdatedBy();
            if (ub != null && ub.contains("withdrawn-by-tenant")) {
                statusForDto = "CANCELED";
            }
        }

        return TransactionResponseDto.builder()
                .id(tx.getId())
                .tenantId(tx.getTenantId())
                .tenantName(tenantName)
                .unitNumber(unitNumber)
                .ownerId(tx.getOwnerId())
                .propertyId(tx.getPropertyId())
                .amount(tx.getAmount())
                .paymentMode(tx.getPaymentMode().name())
                .upiRef(tx.getUpiRef())
                .screenshotUrl(tx.getScreenshotUrl())
                .paymentMonth(tx.getPaymentMonth())
        .status(statusForDto)
                .paymentDate(tx.getPaymentDate() != null ? tx.getPaymentDate().toString() : null)
                .build();
    }
    
    /**
     * Handle multi-tenant payment update logic.
     * When a primary tenant's payment is verified, all other tenants for the same property
     * get marked as "paid" for that month WITHOUT creating actual transaction records.
     * Only executes if the paying tenant has primary=true.
     */
    // Removed @Transactional to avoid conflicts with parent transaction
    private void handleMultiTenantPaymentUpdate(Transaction verifiedTransaction) {
        try {
            System.out.println("=== MULTI-TENANT PAYMENT UPDATE START ===");
            
            // Check if the new payment status table exists by testing a simple query
            try {
                monthlyPaymentStatusRepository.count();
                System.out.println("Payment status repository is available");
            } catch (Exception e) {
                System.err.println("Payment status table not available yet, skipping multi-tenant update: " + e.getMessage());
                return;
            }
            
            // Find the tenant who made this payment
            Optional<Tenant> payingTenantOpt = tenantRepository.findById(verifiedTransaction.getTenantId());
            if (!payingTenantOpt.isPresent()) {
                System.out.println("Could not find tenant for transaction, skipping multi-tenant update");
                return;
            }
            
            Tenant payingTenant = payingTenantOpt.get();
            
            // Mark the paying tenant's month as paid first (regardless of primary status)
            markMonthAsPaid(payingTenant.getId(), verifiedTransaction.getPropertyId(), 
                          verifiedTransaction.getPaymentMonth(), "transaction-" + verifiedTransaction.getId());
            
            // Only proceed with multi-tenant propagation if the paying tenant is PRIMARY
            // (For PG: all tenants are primary, so each pays for all in their unit)
            // (For FLAT: primary tenant pays for all non-primary tenants)
            if (!payingTenant.isPrimary()) {
                System.out.println("Paying tenant (ID: " + payingTenant.getId() + ") is not primary, no multi-tenant propagation needed");
                return;
            }
            
            System.out.println("Primary tenant payment verified, updating other tenants for property: " + verifiedTransaction.getPropertyId());
            
            // Find all other tenants for the same property (excluding the paying tenant)
        List<Tenant> otherTenants = tenantRepository.findByPropertyId(verifiedTransaction.getPropertyId())
            .stream()
            .filter(t -> !t.getId().equals(verifiedTransaction.getTenantId()) && 
                   t.getStatus() == Tenant.TenantStatus.ACTIVE)
            .collect(Collectors.toList());
            
            System.out.println("Found " + otherTenants.size() + " other tenants to mark as paid");
            
            // For each other tenant, mark as paid for this month (without creating transaction)
            for (Tenant otherTenant : otherTenants) {
                // Check if payment status record already exists
                Optional<TenantMonthlyPaymentStatus> existingStatus = monthlyPaymentStatusRepository
                    .findByTenantIdAndPaymentMonth(otherTenant.getId(), verifiedTransaction.getPaymentMonth());
                
                if (existingStatus.isPresent()) {
                    // Update existing record
                    TenantMonthlyPaymentStatus status = existingStatus.get();
                    if (!status.isPaid()) {
                        status.setPaid(true);
                        status.setMarkedPaidDate(LocalDateTime.now());
                        status.setMarkedBy("primary-tenant-payment");
                        monthlyPaymentStatusRepository.save(status);
                        
                        System.out.println("Updated payment status for tenant: " + otherTenant.getTenantName() + 
                                         " for month: " + verifiedTransaction.getPaymentMonth());
                    } else {
                        System.out.println("Tenant " + otherTenant.getTenantName() + " already marked as paid for month: " + 
                                         verifiedTransaction.getPaymentMonth());
                    }
                } else {
                    // Create new payment status record
                    TenantMonthlyPaymentStatus newStatus = TenantMonthlyPaymentStatus.builder()
                            .tenantId(otherTenant.getId())
                            .propertyId(verifiedTransaction.getPropertyId())
                            .paymentMonth(verifiedTransaction.getPaymentMonth())
                            .isPaid(true)
                            .markedPaidDate(LocalDateTime.now())
                            .markedBy("primary-tenant-payment")
                            .build();
                    
                    monthlyPaymentStatusRepository.save(newStatus);
                    
                    System.out.println("Created payment status for tenant: " + otherTenant.getTenantName() + 
                                     " for month: " + verifiedTransaction.getPaymentMonth());
                }
                
                // Send notification to the other tenant
                try {
                    Long tenantUserId = resolveUserIdFromTenantId(otherTenant.getId());
                    if (tenantUserId != null) {
                        String title = "Payment Status Updated ✅";
                        String message = String.format("Your payment for %s has been marked as paid (handled by primary tenant).", 
                            verifiedTransaction.getPaymentMonth());
                        
                        Notification notification = notificationService.createNotification(
                                tenantUserId,
                                verifiedTransaction.getOwnerId(),
                                "PAYMENT_STATUS",
                                title,
                                message,
                                "/tenant-dashboard.html"
                        );
                        System.out.println("Notification sent to tenant: " + otherTenant.getTenantName());
                    }
                    } catch (Exception e) {
                        System.err.println("Failed to send notification to tenant " + otherTenant.getId() + ": " + e.getMessage());
                    }
            }
            
        } catch (Exception e) {
            System.err.println("Error in multi-tenant payment update: " + e.getMessage());
            e.printStackTrace();
            // Don't fail the main transaction, just log the error
        }
    }
    
    /**
     * Clean up invalid auto-generated payments.
     * Removes all auto-generated transactions since the new system uses payment status records instead.
     * Should be called to fix data created before the payment status system was implemented.
     */
    @Transactional
    public int cleanupInvalidAutoGeneratedPayments() {
        try {
            System.out.println("=== CLEANUP INVALID AUTO-GENERATED PAYMENTS ===");
            
            // Find all auto-generated transactions
            List<Transaction> autoGenerated = repository.findByCreatedBy("system-auto-primary-payment");
            System.out.println("Found " + autoGenerated.size() + " auto-generated transactions");
            
            int deletedCount = 0;
            for (Transaction transaction : autoGenerated) {
                // Remove all auto-generated transactions since we now use payment status records
                System.out.println("Deleting auto-generated transaction ID: " + transaction.getId() + 
                                 " for tenant ID: " + transaction.getTenantId());
                repository.delete(transaction);
                deletedCount++;
            }
            
            System.out.println("Cleanup completed. Deleted " + deletedCount + " auto-generated transactions");
            return deletedCount;
            
        } catch (Exception e) {
            System.err.println("Error during cleanup: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to cleanup invalid auto-generated payments", e);
        }
    }

    /**
     * Helper method to mark a month as paid for a tenant
     */
    private void markMonthAsPaid(Long tenantId, Long propertyId, String paymentMonth, String markedBy) {
        try {
            Optional<TenantMonthlyPaymentStatus> existing = monthlyPaymentStatusRepository
                    .findByTenantIdAndPaymentMonth(tenantId, paymentMonth);

            if (existing.isPresent()) {
                TenantMonthlyPaymentStatus status = existing.get();
                if (!status.isPaid()) {
                    status.setPaid(true);
                    status.setMarkedPaidDate(LocalDateTime.now());
                    status.setMarkedBy(markedBy);
                    monthlyPaymentStatusRepository.save(status);
                    System.out.println("Updated payment status for tenant: " + tenantId + " for month: " + paymentMonth);
                }
            } else {
                TenantMonthlyPaymentStatus newStatus = TenantMonthlyPaymentStatus.builder()
                        .tenantId(tenantId)
                        .propertyId(propertyId)
                        .paymentMonth(paymentMonth)
                        .isPaid(true)
                        .markedPaidDate(LocalDateTime.now())
                        .markedBy(markedBy)
                        .build();
                monthlyPaymentStatusRepository.save(newStatus);
                System.out.println("Created payment status for tenant: " + tenantId + " for month: " + paymentMonth);
            }
        } catch (Exception e) {
            System.err.println("Error marking month as paid: " + e.getMessage());
        }
    }
}
