<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function current_admin(): ?array
{
    return $_SESSION['admin_user'] ?? null;
}

function require_admin(): void
{
    if (!current_admin()) {
        header('Location: index.html?login=required');
        exit;
    }
}

function write_admin_log(?int $adminUserId, string $action, string $targetType, ?string $targetId, ?string $targetName, string $detail): void
{
    $stmt = db()->prepare(
        'INSERT INTO admin_activity_logs
            (admin_user_id, action, target_type, target_id, target_name, detail, ip_address, user_agent)
         VALUES
            (:admin_user_id, :action, :target_type, :target_id, :target_name, :detail, :ip_address, :user_agent)'
    );

    $stmt->execute([
        'admin_user_id' => $adminUserId,
        'action' => $action,
        'target_type' => $targetType,
        'target_id' => $targetId,
        'target_name' => $targetName,
        'detail' => $detail,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);
}

