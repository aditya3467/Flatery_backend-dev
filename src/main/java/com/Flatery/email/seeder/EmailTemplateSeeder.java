package com.Flatery.email.seeder;

import com.Flatery.email.EmailType;
import com.Flatery.email.entity.EmailTemplate;
import com.Flatery.email.repository.EmailTemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateSeeder implements CommandLineRunner {

    private final EmailTemplateRepository templateRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking email templates...");

        try {
            List<EmailTemplate> templates = Arrays.asList(
            createTemplate(EmailType.PASSWORD_RESET,
                "Reset your password",
                "<h2>Hello {{user_name}},</h2><p>Click the button below to reset your password for Flatery.</p><a href=\"{{reset_link}}\" style=\"background:#007AFF;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Reset Password</a><p>If you didn't request this, you can ignore this email.</p><p>This link expires in 24 hours.</p>",
                "Reset your password\n\nHi {{user_name}},\nClick here to reset: {{reset_link}}\n\nIf you didn't request this, ignore this email.",
                Arrays.asList("user_name", "reset_link")
            ),
            createTemplate(EmailType.TENANT_ONBOARDING,
                "Welcome to Flatery - Your Tenant Portal",
                "<h2>Welcome {{tenant_name}}!</h2><p>Your account has been created successfully. Access your tenant portal to manage your stay, payments, and complaints.</p><a href=\"{{portal_url}}\" style=\"background:#007AFF;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Open Portal</a><p><strong>Property:</strong> {{property_name}}</p><p><strong>Unit:</strong> {{unit_number}}</p><p><strong>Monthly Rent:</strong> {{monthly_rent}}</p>",
                "Welcome {{tenant_name}}!\n\nYour tenant portal: {{portal_url}}\n\nProperty: {{property_name}}\nUnit: {{unit_number}}\nMonthly Rent: {{monthly_rent}}",
                Arrays.asList("tenant_name", "portal_url", "property_name", "unit_number", "monthly_rent")
            ),
            createTemplate(EmailType.TENANT_WELCOME,
                "Get started with your Flatery account",
                "<h2>Hello {{tenant_name}},</h2><p>Welcome to Flatery! Here's what you can do:</p><ul><li>View your property and unit details</li><li>Submit rent payments</li><li>Track payment history</li><li>Raise and track complaints</li></ul><p><a href=\"{{portal_url}}\">Start exploring</a></p>",
                "Welcome to Flatery {{tenant_name}}!\n\nExplore your portal: {{portal_url}}",
                Arrays.asList("tenant_name", "portal_url")
            ),
            createTemplate(EmailType.TENANT_CREDS,
                "Your Flatery login details",
                "<h2>Hello {{tenant_name}},</h2><p>Your Flatery tenant account has been created.</p><p><strong>Username:</strong> {{username}}<br><strong>Temporary password:</strong> {{temporary_password}}</p><p>Please log in and change your password immediately.</p><p><a href=\"{{portal_url}}\" style=\"background:#007AFF;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Open Tenant Portal</a></p><p><strong>Property:</strong> {{property_name}}</p>",
                "Your Flatery account is ready.\nUsername: {{username}}\nTemporary password: {{temporary_password}}\nLogin: {{portal_url}}\nProperty: {{property_name}}\n\nPlease change your password after first login.",
                Arrays.asList("tenant_name", "username", "temporary_password", "portal_url", "property_name")
            ),
            createTemplate(EmailType.RENT_DUE_REMINDER,
                "Rent due on {{due_date}}",
                "<h2>Rent Payment Reminder</h2><p>Hi {{tenant_name}},</p><p>Your rent for {{property_name}} (Unit {{unit_number}}) is due on <strong>{{due_date}}</strong>.</p><p><strong>Amount:</strong> {{rent_amount}}</p><p><a href=\"{{payment_url}}\" style=\"background:#34C759;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Pay Now</a></p><p>Thank you for timely payments!</p>",
                "Rent Payment Reminder\n\nProperty: {{property_name}}\nUnit: {{unit_number}}\nAmount: {{rent_amount}}\nDue: {{due_date}}\n\nPay here: {{payment_url}}",
                Arrays.asList("tenant_name", "property_name", "unit_number", "rent_amount", "due_date", "payment_url")
            ),
            createTemplate(EmailType.RENT_OVERDUE,
                "URGENT: Rent overdue",
                "<h2 style=\"color:red;\">Rent Payment Overdue</h2><p>Hi {{tenant_name}},</p><p>Your rent for {{property_name}} (Unit {{unit_number}}) was due on {{due_date}}.</p><p><strong>Outstanding Amount:</strong> {{rent_amount}}</p><p><a href=\"{{payment_url}}\" style=\"background:#FF3B30;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Pay Immediately</a></p><p>Please settle this as soon as possible to avoid further action.</p>",
                "URGENT: Rent Overdue\n\nProperty: {{property_name}}\nUnit: {{unit_number}}\nAmount Due: {{rent_amount}}\nDue Date: {{due_date}}\n\nPay now: {{payment_url}}",
                Arrays.asList("tenant_name", "property_name", "unit_number", "rent_amount", "due_date", "payment_url")
            ),
            createTemplate(EmailType.PAYMENT_CONFIRMATION,
                "Payment received - {{amount}}",
                "<h2>Payment Confirmed</h2><p>Hi {{tenant_name}},</p><p>We've received your payment of <strong>{{amount}}</strong> for {{property_name}}.</p><p><strong>Transaction ID:</strong> {{transaction_id}}</p><p><strong>Date:</strong> {{payment_date}}</p><p><a href=\"{{receipt_url}}\">Download Receipt</a></p><p>Thank you for your timely payment!</p>",
                "Payment Confirmed\n\nAmount: {{amount}}\nProperty: {{property_name}}\nTransaction ID: {{transaction_id}}\nDate: {{payment_date}}\n\nReceipt: {{receipt_url}}",
                Arrays.asList("tenant_name", "amount", "property_name", "transaction_id", "payment_date", "receipt_url")
            ),
            createTemplate(EmailType.LISTING_APPROVED,
                "Your property listing has been approved",
                "<h2>Great news!</h2><p>Hi {{owner_name}},</p><p>Your property <strong>{{property_name}}</strong> has been approved and is now visible to tenants.</p><p>Your listing will drive traffic and inquiries. Manage your property here:</p><a href=\"{{dashboard_url}}\" style=\"background:#007AFF;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Go to Dashboard</a>",
                "Your property {{property_name}} is now live on Flatery.\n\nDashboard: {{dashboard_url}}",
                Arrays.asList("owner_name", "property_name", "dashboard_url")
            ),
            createTemplate(EmailType.LISTING_BLOCKED,
                "Your property listing requires review",
                "<h2>Property Listing Review</h2><p>Hi {{owner_name}},</p><p>Your property <strong>{{property_name}}</strong> is temporarily unavailable due to:</p><p><strong>Reason:</strong> {{block_reason}}</p><p>Please review our guidelines and update your listing. Contact support for assistance.</p><p><a href=\"{{support_url}}\">Contact Support</a></p>",
                "Your property {{property_name}} requires review.\n\nReason: {{block_reason}}\n\nSupport: {{support_url}}",
                Arrays.asList("owner_name", "property_name", "block_reason", "support_url")
            ),
            createTemplate(EmailType.PAYMENT_SUBMISSION,
                "New Payment Submission - {{amount}} from {{tenant_name}}",
                "<h2>New Payment Submission</h2><p>Hi {{owner_name}},</p><p><strong>{{tenant_name}}</strong> has submitted a payment for your approval.</p><p><strong>Amount:</strong> ₹{{amount}}<br><strong>Month:</strong> {{payment_month}}<br><strong>Payment Mode:</strong> {{payment_mode}}<br><strong>Date Submitted:</strong> {{submission_date}}</p><p><a href=\"{{dashboard_url}}\" style=\"background:#FF9500;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Review Payment</a></p><p>Please verify and approve or reject this payment submission.</p>",
                "New Payment Submission\n\nTenant: {{tenant_name}}\nAmount: ₹{{amount}}\nMonth: {{payment_month}}\nMode: {{payment_mode}}\nDate: {{submission_date}}\n\nReview: {{dashboard_url}}",
                Arrays.asList("owner_name", "tenant_name", "amount", "payment_month", "payment_mode", "submission_date", "dashboard_url")
            ),
            createTemplate(EmailType.PAYMENT_APPROVED,
                "Your Payment has been Approved ✅",
                "<h2>Payment Approved</h2><p>Hi {{tenant_name}},</p><p>Your payment of <strong>₹{{amount}}</strong> for {{property_name}} has been approved and verified by your owner.</p><p><strong>Month:</strong> {{payment_month}}<br><strong>Approval Date:</strong> {{approval_date}}<br><strong>Transaction ID:</strong> {{transaction_id}}</p><p><a href=\"{{payment_history_url}}\" style=\"background:#34C759;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">View Payment History</a></p><p>Thank you for your timely payment!</p>",
                "Your Payment Approved ✅\n\nAmount: ₹{{amount}}\nMonth: {{payment_month}}\nApproved: {{approval_date}}\nTransaction ID: {{transaction_id}}\n\nPayment History: {{payment_history_url}}",
                Arrays.asList("tenant_name", "amount", "property_name", "payment_month", "approval_date", "transaction_id", "payment_history_url")
            ),
            createTemplate(EmailType.PAYMENT_REJECTED,
                "Your Payment Submission was Rejected ❌",
                "<h2>Payment Rejected</h2><p>Hi {{tenant_name}},</p><p>Your payment submission of <strong>₹{{amount}}</strong> for {{property_name}} has been rejected.</p><p><strong>Month:</strong> {{payment_month}}<br><strong>Rejection Date:</strong> {{rejection_date}}<br><strong>Reason:</strong> {{rejection_reason}}</p><p>Please contact your owner for clarification or submit a corrected payment.</p><p><a href=\"{{submit_payment_url}}\" style=\"background:#FF3B30;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Submit Payment Again</a></p>",
                "Your Payment was Rejected ❌\n\nAmount: ₹{{amount}}\nMonth: {{payment_month}}\nReason: {{rejection_reason}}\nRejected: {{rejection_date}}\n\nSubmit again: {{submit_payment_url}}",
                Arrays.asList("tenant_name", "amount", "property_name", "payment_month", "rejection_reason", "rejection_date", "submit_payment_url")
            ),
            createTemplate(EmailType.PAYMENT_REMINDER,
                "Payment Pending - {{amount}} from {{tenant_name}}",
                "<h2>Payment Pending Review</h2><p>Hi {{owner_name}},</p><p><strong>{{tenant_name}}</strong> has submitted a payment of <strong>₹{{amount}}</strong> that is awaiting your review.</p><p><strong>Month:</strong> {{payment_month}}<br><strong>Days Pending:</strong> {{days_pending}}<br><strong>Status:</strong> Pending Approval</p><p><a href=\"{{dashboard_url}}\" style=\"background:#FF9500;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Approve or Reject</a></p><p>This payment has been pending for {{days_pending}} days. Please take action soon.</p>",
                "Reminder: Pending Payment Review\n\nTenant: {{tenant_name}}\nAmount: ₹{{amount}}\nMonth: {{payment_month}}\nDays Pending: {{days_pending}}\n\nDashboard: {{dashboard_url}}",
                Arrays.asList("owner_name", "tenant_name", "amount", "payment_month", "days_pending", "dashboard_url")
            ),
            createTemplate(EmailType.MAINTENANCE_REQUEST_SUBMITTED,
                "New Maintenance Request from {{tenant_name}}",
                "<h2>New Maintenance Request</h2><p>Hi {{owner_name}},</p><p><strong>{{tenant_name}}</strong> from Unit {{unit_number}} has submitted a maintenance request.</p><p><strong>Issue:</strong> {{issue_title}}<br><strong>Description:</strong> {{issue_description}}<br><strong>Priority:</strong> {{priority}}<br><strong>Date Submitted:</strong> {{submission_date}}</p><p><a href=\"{{dashboard_url}}\" style=\"background:#FF9500;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">View Request</a></p><p>Please respond to the tenant as soon as possible.</p>",
                "New Maintenance Request\n\nFrom: {{tenant_name}} (Unit {{unit_number}})\nIssue: {{issue_title}}\nDescription: {{issue_description}}\nPriority: {{priority}}\nDate: {{submission_date}}\n\nView: {{dashboard_url}}",
                Arrays.asList("owner_name", "tenant_name", "unit_number", "issue_title", "issue_description", "priority", "submission_date", "dashboard_url")
            ),
            createTemplate(EmailType.MAINTENANCE_REQUEST_ACKNOWLEDGED,
                "Your Maintenance Request has been Acknowledged",
                "<h2>Request Acknowledged</h2><p>Hi {{tenant_name}},</p><p>Your maintenance request for <strong>{{issue_title}}</strong> has been received and acknowledged by your owner.</p><p><strong>Unit:</strong> {{unit_number}}<br><strong>Status:</strong> {{status}}<br><strong>Expected Resolution:</strong> {{resolution_time}}<br><strong>Owner's Message:</strong> {{owner_message}}</p><p><a href=\"{{tracking_url}}\" style=\"background:#34C759;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Track Request</a></p><p>We will update you once the work is completed.</p>",
                "Maintenance Request Acknowledged\n\nIssue: {{issue_title}}\nStatus: {{status}}\nExpected: {{resolution_time}}\nMessage: {{owner_message}}\n\nTrack: {{tracking_url}}",
                Arrays.asList("tenant_name", "unit_number", "issue_title", "status", "resolution_time", "owner_message", "tracking_url")
            ),
            createTemplate(EmailType.MAINTENANCE_REQUEST_RESOLVED,
                "Your Maintenance Request has been Resolved ✅",
                "<h2>Request Completed</h2><p>Hi {{tenant_name}},</p><p>Your maintenance request for <strong>{{issue_title}}</strong> in Unit {{unit_number}} has been completed.</p><p><strong>Work Completed:</strong> {{completion_date}}<br><strong>Completion Notes:</strong> {{completion_notes}}</p><p>If you have any concerns or the issue persists, please contact your owner immediately.</p><p><a href=\"{{feedback_url}}\" style=\"background:#34C759;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;display:inline-block;\">Provide Feedback</a></p><p>Thank you for your patience!</p>",
                "Maintenance Request Resolved ✅\n\nIssue: {{issue_title}}\nUnit: {{unit_number}}\nCompleted: {{completion_date}}\nNotes: {{completion_notes}}\n\nFeedback: {{feedback_url}}",
                Arrays.asList("tenant_name", "unit_number", "issue_title", "completion_date", "completion_notes", "feedback_url")
            )
        );

        int created = 0;
        for (EmailTemplate template : templates) {
            boolean exists = templateRepository.findFirstByTemplateKeyAndActiveTrue(template.getTemplateKey()).isPresent();
            if (exists) {
                log.debug("Template {} already present, skipping", template.getTemplateKey());
                continue;
            }
            templateRepository.save(template);
            created++;
            log.info("Created email template {}", template.getTemplateKey());
        }

        log.info("Email template seeding complete. New templates added: {}", created);
        } catch (Exception e) {
            log.error("Email template seeding failed: {}. Emails will not be sent until templates are created.", e.getMessage());
            // Don't fail app startup if email templates can't be created
        }
    }

    private EmailTemplate createTemplate(EmailType type, String subject, String htmlBody, String textBody, List<String> placeholders) throws Exception {
        return EmailTemplate.builder()
                .templateKey(type)
                .subject(subject)
                .htmlBody(htmlBody)
                .textBody(textBody)
                .placeholdersJson(objectMapper.writeValueAsString(placeholders))
                .active(true)
                .lastUpdatedBy("system")
                .build();
    }
}
