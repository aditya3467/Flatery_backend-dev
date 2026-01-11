# FLATERY Email Integration

This module implements a centralized, event-driven email system with DB-backed templates, async queue, SMTP sender, and full audit logs.

Core flow: Event -> Dispatcher -> Template Resolver -> Queue -> SMTP Worker -> Logs.

## What was added
- Email types enum: `src/main/java/com/Flatery/email/EmailType.java`
- DB entities: `EmailConfig`, `EmailTemplate`, `EmailQueue`, `EmailLog`
- Repositories: for each entity
- Services:
  - `EncryptionService` (AES-GCM) for SMTP password
  - `EmailTemplateService` (placeholder parsing and rendering)
  - `EmailConfigService` (builds `JavaMailSender` from DB config)
  - `EmailDispatcher` (validates templates, merges data, enqueues)
  - `EmailEvents` (publish events from business code)
  - `SmtpSenderService` (sends via SMTP)
  - `EmailSenderWorker` (scheduled worker with retries/backoff)
- Event + listener: `EmailDispatchEvent` -> `EmailEventListener`
- Superadmin API: `EmailAdminController` under `/api/superadmin/email`
- Scheduler scaffold for rent reminders (disabled by default)

## Dependencies
Added in `pom.xml`:
- `spring-boot-starter-mail`
- `org.apache.commons:commons-text` (may be removed if not needed)

## Configuration
Set an encryption secret for SMTP password:

```bash
export APP_ENCRYPTION_SECRET="change_this_to_a_strong_secret"
```

Enable the rent reminder scheduler (optional):

```properties
app.scheduler.rent-reminders.enabled=true
```

Scheduling is enabled via `@EnableScheduling` in `Application`.

## Superadmin endpoints
All endpoints are restricted to `ROLE_SUPERADMIN`.

- GET `/api/superadmin/email/config` – fetch current SMTP config
- POST `/api/superadmin/email/config` – upsert SMTP config
  - body:
    ```json
    {
      "provider": "SMTP",
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "your@gmail.com",
      "password": "app_password",
      "encryption": "TLS",
      "fromName": "Flatery",
      "fromEmail": "your@gmail.com",
      "replyTo": "support@yourdomain.com",
      "enabled": true,
      "paused": false
    }
    ```
- POST `/api/superadmin/email/config/test` – send a test email
  - body: `{ "to": "you@example.com" }`
- GET `/api/superadmin/email/templates` – list templates
- POST `/api/superadmin/email/templates` – upsert active template for a given type
  - body:
    ```json
    {
      "templateKey": "RENT_DUE_REMINDER",
      "subject": "Rent due on {{due_date}}",
      "htmlBody": "<p>Hi {{tenant_name}}, your rent of {{rent_amount}} is due on {{due_date}}.</p>",
      "textBody": "Hi {{tenant_name}}, your rent of {{rent_amount}} is due on {{due_date}}.",
      "placeholders": ["tenant_name", "rent_amount", "due_date"],
      "active": true,
      "updatedBy": "superadmin@flatery.in"
    }
    ```
- POST `/api/superadmin/email/dispatch` – manual dispatch (for testing)
  - body:
    ```json
    {
      "type": "PASSWORD_RESET",
      "recipient": "user@example.com",
      "data": { "reset_link": "https://app/reset?token=..." }
    }
    ```
- GET `/api/superadmin/email/logs/recent` – recent logs

## Using from business code (no direct send)
Publish an event; the dispatcher will validate and queue:

```java
@Autowired private com.Flatery.email.service.EmailEvents emailEvents;

public void sendReset(User user, String token) {
    Map<String, Object> data = Map.of(
        "reset_link", baseUrl + "/reset?token=" + token
    );
    emailEvents.publish(com.Flatery.email.EmailType.PASSWORD_RESET, user.getEmail(), data);
}
```

## Retry and failure behavior
- Worker retries up to 3 times with backoff (5m, 15m, 30m)
- Logs all outcomes to `email_logs`
- If template missing/inactive: dispatcher logs SKIPPED
- If placeholders missing: dispatcher logs FAILED and throws

## Moving from Gmail to org SMTP
No code changes required. Update SMTP config via the Superadmin endpoint. Ensure SPF/DKIM/DMARC for deliverability.

## Notes
- Templates live in DB; only Superadmin should manage them from the provided endpoints.
- Owners have no access to configuration or templates.
- For high volume, put the worker on a dedicated pod/instance.
