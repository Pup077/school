<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

$username = trim((string)($_POST['username'] ?? ''));
$password = (string)($_POST['password'] ?? '');

if ($username === '' || $password === '') {
    header('Location: index.html?login=empty');
    exit;
}

try {
    $stmt = db()->prepare(
        'SELECT id, username, password_hash, full_name, role, is_active
         FROM admin_users
         WHERE username = :username
         LIMIT 1'
    );
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user || (int)$user['is_active'] !== 1 || !password_verify($password, $user['password_hash'])) {
        header('Location: index.html?login=failed');
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['admin_user'] = [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
    ];
    $_SESSION['admin_last_activity'] = time();

    db()->prepare('UPDATE admin_users SET last_login_at = NOW() WHERE id = :id')
        ->execute(['id' => (int)$user['id']]);

    write_admin_log((int)$user['id'], 'login', 'admin_user', (string)$user['id'], $user['username'], 'เข้าสู่ระบบผู้ดูแล');

    header('Location: admin-dashboard.php');
    exit;
} catch (Throwable $error) {
    header('Location: index.html?login=db_error');
    exit;
}
