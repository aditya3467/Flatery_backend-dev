-- Migration: Insert email template for OTP password reset

INSERT INTO email_templates (template_key, subject, html_body, text_body, placeholders_json, is_active, created_at, updated_at, last_updated_by)
VALUES (
    'OTP_RESET_PASSWORD',
    'Your Password Reset OTP - {{otp}}',
    '<html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">Hello {{userName}},</p>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    We received a request to reset your password. Please use the OTP code below to proceed:
                </p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code:</p>
                    <p style="margin: 10px 0 0 0; color: #007bff; font-size: 28px; font-weight: bold; letter-spacing: 5px;">{{otp}}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>This OTP is valid for {{expiryMinutes}} minutes.</strong>
                </p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 13px;">
                        <strong>Security Notice:</strong> Do not share this OTP with anyone. Our team will never ask for your OTP.
                    </p>
                </div>
                
                <p style="color: #999; font-size: 12px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    If you did not request a password reset, please ignore this email. Your account will remain secure.
                </p>
                
                <p style="color: #999; font-size: 12px; line-height: 1.6; margin-top: 10px;">
                    – Flatery Team
                </p>
            </div>
        </body>
    </html>',
    'Hello {{userName}},

We received a request to reset your password. Please use the OTP code below to proceed:

Your OTP Code: {{otp}}

This OTP is valid for {{expiryMinutes}} minutes.

SECURITY NOTICE: Do not share this OTP with anyone. Our team will never ask for your OTP.

If you did not request a password reset, please ignore this email. Your account will remain secure.

– Flatery Team',
    '["userName", "otp", "expiryMinutes"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'System'
);
