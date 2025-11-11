-- Fix transactions.status column to support CANCELED status
-- Run this in your MySQL client or workbench

USE flatery_db;

-- Check current column definition
DESCRIBE transactions;

-- Modify the status column to VARCHAR(32)
ALTER TABLE transactions
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

-- Verify the change
DESCRIBE transactions;

-- Show current statuses in the table
SELECT DISTINCT status FROM transactions;
