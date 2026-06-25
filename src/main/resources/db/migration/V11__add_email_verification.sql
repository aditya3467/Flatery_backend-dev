-- Migration: Email verification support

ALTER TABLE users
    ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN email_verified_at DATETIME NULL;

-- Keep existing users functional after rollout
UPDATE users
SET verified = TRUE,
    email_verified_at = COALESCE(updated_at, created_at, NOW())
WHERE verified = FALSE;

CREATE TABLE email_verification_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_evt_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_evt_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_evt_user_id (user_id),
    INDEX idx_evt_expires_at (expires_at)
);

INSERT INTO email_templates (template_key, subject, html_body, text_body, placeholders_json, is_active, created_at, updated_at, last_updated_by)
VALUES (
    'EMAIL_VERIFICATION',
    'Verify your Flatery account',
    '<html><body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;"><div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;"><h2 style="color: #333;">Welcome to Flatery, {{user_name}}!</h2><p style="color: #666; line-height: 1.6;">Please verify your email address to activate your account.</p><p style="margin: 24px 0;"><a href="{{verification_link}}" style="background:#007bff;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Verify Email</a></p><p style="color:#666; line-height:1.6;">This link is valid for {{expiry_hours}} hours.</p><p style="color:#999; font-size:12px;">If you did not create this account, you can ignore this email.</p></div></body></html>',
    'Welcome to Flatery, {{user_name}}!\n\nPlease verify your email address using this link:\n{{verification_link}}\n\nThis link is valid for {{expiry_hours}} hours.',
    '["user_name", "verification_link", "expiry_hours"]',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'System'
);
