-- Ensure transactions.status can accept new values like 'CANCELED'
-- This migration converts the column to a flexible VARCHAR to avoid ENUM truncation issues.

-- MySQL/MariaDB: widen/convert the status column to VARCHAR(32)
ALTER TABLE transactions
    MODIFY COLUMN status VARCHAR(32) NOT NULL;