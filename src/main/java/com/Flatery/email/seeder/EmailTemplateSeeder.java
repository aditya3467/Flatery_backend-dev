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
        
        long count = templateRepository.count();
        if (count > 0) {
            log.info("Templates already exist ({} found), skipping seeder.", count);
            return;
        }

        log.info("Creating default email templates...");
        
        templateRepository.saveAll(Arrays.asList(
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
            )
        ));

        log.info("Email templates seeded successfully!");
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
