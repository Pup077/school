<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const ADMIN_SESSION_TIMEOUT = 900;

if (session_status() !== PHP_SESSION_ACTIVE) {
    $sessionPath = dirname(__DIR__) . '/storage/sessions';
    if (!is_dir($sessionPath)) {
        mkdir($sessionPath, 0775, true);
    }
    session_save_path($sessionPath);
    session_start();
}

function expire_admin_session(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
}

function current_admin(): ?array
{
    $admin = $_SESSION['admin_user'] ?? null;
    if (!$admin) {
        return null;
    }

    $lastActivity = (int)($_SESSION['admin_last_activity'] ?? 0);
    if ($lastActivity > 0 && time() - $lastActivity > ADMIN_SESSION_TIMEOUT) {
        expire_admin_session();
        return null;
    }

    $_SESSION['admin_last_activity'] = time();
    return $admin;
}

function admin_session_remaining_seconds(): int
{
    if (!isset($_SESSION['admin_user'], $_SESSION['admin_last_activity'])) {
        return 0;
    }

    return max(0, ADMIN_SESSION_TIMEOUT - (time() - (int)$_SESSION['admin_last_activity']));
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
