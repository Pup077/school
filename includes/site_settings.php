<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function ensure_site_settings_schema(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    db()->exec(
        'CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(80) PRIMARY KEY,
            setting_value TEXT NULL,
            updated_by INT UNSIGNED NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_site_settings_updated_by
                FOREIGN KEY (updated_by) REFERENCES admin_users(id)
                ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $ensured = true;
}

function site_setting(string $key, string $default = ''): string
{
    ensure_site_settings_schema();
    $stmt = db()->prepare('SELECT setting_value FROM site_settings WHERE setting_key = :setting_key LIMIT 1');
    $stmt->execute(['setting_key' => $key]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string)$value;
}

function save_site_setting(string $key, string $value, ?int $adminId = null): void
{
    ensure_site_settings_schema();
    $stmt = db()->prepare(
        'INSERT INTO site_settings (setting_key, setting_value, updated_by)
         VALUES (:setting_key, :setting_value, :updated_by)
         ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_by = VALUES(updated_by)'
    );
    $stmt->execute([
        'setting_key' => $key,
        'setting_value' => $value,
        'updated_by' => $adminId,
    ]);
}
