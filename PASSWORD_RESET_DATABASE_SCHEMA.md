# Database Schema - Password Reset OTP

## Table Structure

```sql
CREATE TABLE password_reset_otp (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_otp (otp),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    
    CONSTRAINT fk_password_reset_otp_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Column Definitions

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | BIGINT | NO | AUTO_INCREMENT | Primary key, unique OTP record identifier |
| `user_id` | BIGINT | NO | - | Foreign key to users table, cannot be NULL |
| `email` | VARCHAR(100) | NO | - | Email address where OTP was sent, indexed for fast lookup |
| `otp` | VARCHAR(6) | NO | - | 6-digit OTP code, stored as string |
| `expires_at` | DATETIME | NO | - | Timestamp when OTP expires, used for cleanup |
| `is_used` | BOOLEAN | NO | FALSE | Prevents OTP reuse, marks successful verification |
| `attempts` | INT | NO | 0 | Counter for failed verification attempts |
| `created_at` | DATETIME | NO | CURRENT_TIMESTAMP | Auto-timestamp of record creation |

## Indexes

| Index Name | Columns | Purpose | Query Performance |
|------------|---------|---------|------------------|
| `idx_email` | email | Fast lookup of OTPs by email address | O(log n) |
| `idx_otp` | otp | Find specific OTP records quickly | O(log n) |
| `idx_expires_at` | expires_at | Efficient cleanup of expired records | O(log n) |
| `idx_user_id` | user_id | Link OTPs to users | O(log n) |

## Relationships

```
users (id) ─────► password_reset_otp (user_id)
   |
   └─ ONE-TO-MANY
   └─ Cascade Delete: Deleting user also deletes all their OTP records
```

## Sample Data

```sql
-- Sample OTP record
INSERT INTO password_reset_otp 
(user_id, email, otp, expires_at, is_used, attempts, created_at) 
VALUES 
(1, 'john@example.com', '482193', '2026-01-17 14:10:00', false, 0, '2026-01-17 14:00:00');

-- After successful verification
UPDATE password_reset_otp 
SET is_used = true 
WHERE id = 1;

-- After failed attempts
UPDATE password_reset_otp 
SET attempts = attempts + 1 
WHERE id = 1;
```

## Query Examples

### Get Latest Valid OTP for User
```sql
SELECT * FROM password_reset_otp 
WHERE email = 'user@example.com' 
  AND is_used = false 
  AND expires_at > NOW() 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check if User Has Valid OTP
```sql
SELECT COUNT(*) as has_valid_otp 
FROM password_reset_otp 
WHERE email = 'user@example.com' 
  AND is_used = false 
  AND expires_at > NOW();
```

### Count Failed Attempts
```sql
SELECT attempts FROM password_reset_otp 
WHERE email = 'user@example.com' 
  AND is_used = false 
ORDER BY created_at DESC 
LIMIT 1;
```

### Rate Limiting Query (OTPs in last 1 minute)
```sql
SELECT COUNT(*) as recent_requests 
FROM password_reset_otp 
WHERE email = 'user@example.com' 
  AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE);
```

### Cleanup: Delete Expired OTPs
```sql
DELETE FROM password_reset_otp 
WHERE expires_at < NOW();
```

### Cleanup: Delete Used and Expired OTPs
```sql
DELETE FROM password_reset_otp 
WHERE is_used = true AND expires_at < NOW();
```

### View All OTPs for a User (Admin)
```sql
SELECT * FROM password_reset_otp 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Get OTP Statistics
```sql
SELECT 
    COUNT(*) as total_otps,
    SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) as used_otps,
    SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_otps,
    SUM(CASE WHEN is_used = false AND expires_at > NOW() THEN 1 ELSE 0 END) as valid_otps,
    AVG(attempts) as avg_attempts,
    MAX(attempts) as max_attempts
FROM password_reset_otp;
```

## Storage & Performance

### Index Storage
```
idx_email: ~100 bytes per entry
idx_otp: ~100 bytes per entry
idx_expires_at: ~100 bytes per entry
idx_user_id: ~100 bytes per entry
```

### Average Record Size
```
Full record: ~200 bytes
Estimated storage for 100K records: ~20 MB
Estimated storage for 1M records: ~200 MB
```

### Query Performance (Estimated)
- Single OTP lookup: < 1ms
- User's all OTPs: < 5ms
- Rate limit check: < 2ms
- Cleanup operation: < 100ms (for expired records)

## Maintenance Tasks

### Daily Monitoring
```sql
-- Check valid OTPs waiting for verification
SELECT COUNT(*) FROM password_reset_otp 
WHERE is_used = false AND expires_at > NOW();

-- Check failed attempts patterns
SELECT email, MAX(attempts) as max_attempts 
FROM password_reset_otp 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) 
GROUP BY email 
HAVING max_attempts >= 3;
```

### Weekly Cleanup
```sql
-- Archive used OTPs (optional - before deleting)
INSERT INTO password_reset_otp_archive 
SELECT * FROM password_reset_otp 
WHERE is_used = true AND expires_at < NOW();

-- Delete cleaned records
DELETE FROM password_reset_otp 
WHERE is_used = true AND expires_at < NOW();
```

### Monthly Analysis
```sql
-- Success rate
SELECT 
    COUNT(*) as total_attempts,
    SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) as successful_resets,
    ROUND(SUM(CASE WHEN is_used = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM password_reset_otp 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Average time to completion
SELECT 
    DATE(created_at) as reset_date,
    COUNT(*) as total,
    AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())) as avg_minutes_pending
FROM password_reset_otp 
WHERE is_used = false
GROUP BY DATE(created_at)
ORDER BY reset_date DESC;
```

## Related Tables

### users
```
id (FK source)
├── email
├── password (updated when OTP verified)
├── first_name (used in email greeting)
└── last_name
```

### email_templates
```
OTP_RESET_PASSWORD (associated template)
├── subject
├── html_body
├── text_body
└── placeholders_json
```

## Considerations

### Data Privacy
- OTP is sensitive data, consider encryption at rest
- Log only non-sensitive OTP details
- Don't log OTP value itself
- Comply with GDPR retention policies

### Scalability
- Current indexes scale well up to millions of records
- Consider partitioning if reaching 100M+ records
- Archive old OTPs to separate table if needed

### Security
- OTP in varchar(6) is fine for numeric codes
- Consider adding salt to OTP before storing (optional)
- Indexes don't affect security
- Foreign key constraint ensures data integrity

## Backup Strategy

### Full Backup
```bash
# Backup entire table
mysqldump flatery_db password_reset_otp > otp_backup.sql

# Restore
mysql flatery_db < otp_backup.sql
```

### Differential Backup
```sql
-- Backup only used and verified OTPs
SELECT * INTO OUTFILE '/backup/otp_archive.csv'
FROM password_reset_otp 
WHERE is_used = true 
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Troubleshooting

### Missing OTPs in Database
**Problem**: OTP not found after sending
**Check**:
```sql
SELECT * FROM password_reset_otp 
ORDER BY created_at DESC LIMIT 10;
```
**Solutions**:
- Verify email address matches exactly
- Check if OTP was expired by cleanup scheduler
- Verify user exists in users table

### Too Many OTPs for Single Email
**Problem**: Multiple OTPs for same email accumulating
**Check**:
```sql
SELECT email, COUNT(*) as count 
FROM password_reset_otp 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY email 
HAVING count > 5;
```
**Solution**: Ensure cleanup scheduler is running

### Indexes Not Used
**Problem**: Queries seem slow despite indexes
**Check**:
```sql
ANALYZE TABLE password_reset_otp;
EXPLAIN SELECT * FROM password_reset_otp 
WHERE email = 'test@example.com';
```
**Solution**: May need index rebuild or statistics refresh

## Migration File

Located at: `src/main/resources/db/migration/V9__create_password_reset_otp_table.sql`

Automatically executed by:
- Flyway (on application startup)
- Runs once due to versioning system
- Safe to run multiple times (idempotent)
