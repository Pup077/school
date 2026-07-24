<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function ensure_calendar_schema(): void
{
    db()->exec(
        'CREATE TABLE IF NOT EXISTS calendar_events (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            event_date DATE NOT NULL,
            event_type ENUM("school", "holiday", "important") NOT NULL DEFAULT "school",
            status ENUM("draft", "published") NOT NULL DEFAULT "published",
            created_by INT UNSIGNED NULL,
            updated_by INT UNSIGNED NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_calendar_date_status (event_date, status),
            CONSTRAINT fk_calendar_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
            CONSTRAINT fk_calendar_updated_by FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}
