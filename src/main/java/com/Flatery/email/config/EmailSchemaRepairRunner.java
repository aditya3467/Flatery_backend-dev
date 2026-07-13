package com.Flatery.email.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailSchemaRepairRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        repairEmailTypeColumn("email_queue");
        repairEmailTypeColumn("email_logs");
    }

    private void repairEmailTypeColumn(String tableName) {
        try {
            if (!tableExists(tableName) || !columnExists(tableName, "email_type")) {
                return;
            }

            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY email_type VARCHAR(64) NOT NULL");
            log.info("Ensured {}.email_type supports all Flatery email types", tableName);
        } catch (Exception e) {
            log.warn("Could not repair {}.email_type column: {}", tableName, e.getMessage());
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }
}
