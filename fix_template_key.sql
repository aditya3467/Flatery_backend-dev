-- Fix template_key column size issue
-- This SQL must be executed on your flatery_db database before starting the app
-- 
-- How to run:
-- 1. Open MySQL Workbench, Sequel Pro, TablePlus, DBeaver, or phpMyAdmin
-- 2. Connect to your local MySQL database
-- 3. Execute these commands:

USE flatery_db;

-- Check current column definition
SHOW COLUMNS FROM email_templates LIKE 'template_key';

-- Fix the column size (enlarge to VARCHAR(64))
ALTER TABLE email_templates MODIFY COLUMN template_key VARCHAR(64) NOT NULL;

-- Verify the change worked
SHOW COLUMNS FROM email_templates LIKE 'template_key';
