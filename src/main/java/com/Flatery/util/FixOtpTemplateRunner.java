package com.Flatery.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class FixOtpTemplateRunner implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Only run if --fix-otp-template argument is provided
        boolean shouldFix = false;
        for (String arg : args) {
            if ("--fix-otp-template".equals(arg)) {
                shouldFix = true;
                break;
            }
        }

        if (!shouldFix) {
            return;
        }

        System.out.println("========================================");
        System.out.println("Fixing OTP Email Template...");
        System.out.println("========================================");

        try {
            // Delete existing template
            int deleted = jdbcTemplate.update("DELETE FROM email_templates WHERE template_key = 'OTP_RESET_PASSWORD'");
            System.out.println("Deleted " + deleted + " existing OTP template(s)");

            // Insert new template with correct column name
            String sql = "INSERT INTO email_templates (template_key, subject, html_body, text_body, placeholders_json, is_active, created_at, updated_at, last_updated_by) " +
                    "VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)";

            String htmlBody = "<html>" +
                    "<body style=\"font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;\">" +
                    "<div style=\"max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\">" +
                    "<h2 style=\"color: #333; margin-bottom: 20px;\">Password Reset Request</h2>" +
                    "<p style=\"color: #666; font-size: 14px; line-height: 1.6;\">Hello {{userName}},</p>" +
                    "<p style=\"color: #666; font-size: 14px; line-height: 1.6;\">We received a request to reset your password. Please use the OTP code below to proceed:</p>" +
                    "<div style=\"background-color: #f9f9f9; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 4px;\">" +
                    "<p style=\"margin: 0; color: #666; font-size: 14px;\">Your OTP Code:</p>" +
                    "<p style=\"margin: 10px 0 0 0; color: #007bff; font-size: 28px; font-weight: bold; letter-spacing: 5px;\">{{otp}}</p>" +
                    "</div>" +
                    "<p style=\"color: #666; font-size: 14px; line-height: 1.6;\"><strong>This OTP is valid for {{expiryMinutes}} minutes.</strong></p>" +
                    "<div style=\"background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;\">" +
                    "<p style=\"margin: 0; color: #856404; font-size: 13px;\"><strong>Security Notice:</strong> Do not share this OTP with anyone.</p>" +
                    "</div>" +
                    "<p style=\"color: #999; font-size: 12px; line-height: 1.6; margin-top: 30px;\">If you did not request a password reset, please ignore this email.</p>" +
                    "<p style=\"color: #999; font-size: 12px;\">– Flatery Team</p>" +
                    "</div></body></html>";

            String textBody = "Hello {{userName}},\n\n" +
                    "We received a request to reset your password. Please use the OTP code below to proceed:\n\n" +
                    "Your OTP Code: {{otp}}\n\n" +
                    "This OTP is valid for {{expiryMinutes}} minutes.\n\n" +
                    "SECURITY NOTICE: Do not share this OTP with anyone.\n\n" +
                    "If you did not request a password reset, please ignore this email.\n\n" +
                    "– Flatery Team";

            String placeholders = "[\"userName\", \"otp\", \"expiryMinutes\"]";

            int inserted = jdbcTemplate.update(sql,
                    "OTP_RESET_PASSWORD",
                    "Your Password Reset OTP",
                    htmlBody,
                    textBody,
                    placeholders,
                    true,
                    "System"
            );

            System.out.println("✅ Successfully inserted OTP email template! (" + inserted + " row)");
            System.out.println("========================================");
            System.out.println("Template is now active and ready to use.");
            System.out.println("Try the forgot password flow again!");
            System.out.println("========================================");

        } catch (Exception e) {
            System.err.println("❌ Error fixing OTP template: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
