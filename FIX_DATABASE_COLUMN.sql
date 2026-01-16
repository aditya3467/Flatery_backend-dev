-- ========================================
-- REQUIRED: Fix email_templates column
-- ========================================
-- This SQL MUST be run on your database to enable credential emails
-- 
-- HOW TO RUN THIS:
-- 1. Open your MySQL client (Workbench, Sequel Pro, TablePlus, DBeaver, or phpMyAdmin)
-- 2. Connect to localhost:3306 with username: root (no password)
-- 3. Copy and paste the commands below and execute them
-- ========================================

USE flatery_db;

-- Check current column size (should show VARCHAR(20) or smaller - that's the problem!)
SHOW COLUMNS FROM email_templates LIKE 'template_key';

-- FIX: Widen the column to VARCHAR(64) to fit all enum names
ALTER TABLE email_templates MODIFY COLUMN template_key VARCHAR(64) NOT NULL;

-- Verify the fix worked (should now show VARCHAR(64))
SHOW COLUMNS FROM email_templates LIKE 'template_key';

-- AFTER running this SQL, restart your Spring Boot app
-- The email templates will be created and credential emails will work
