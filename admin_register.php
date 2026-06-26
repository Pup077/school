<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: admin-register.html');
    exit;
}

$fullName = trim((string)($_POST['fullName'] ?? ''));
$username = trim((string)($_POST['username'] ?? ''));
$password = (string)($_POST['password'] ?? '');
$confirmPassword = (string)($_POST['confirmPassword'] ?? '');
$role = (string)($_POST['role'] ?? 'editor');
$allowedRoles = ['admin', 'editor'];

if ($fullName === '' || $username === '' || $password === '' || $confirmPassword === '') {
    header('Location: admin-register.html?register=empty');
    exit;
}

if (strlen($password) < 6) {
    header('Location: admin-register.html?register=short_password');
    exit;
}

if ($password !== $confirmPassword) {
    header('Location: admin-register.html?register=password_mismatch');
    exit;
}

if (!in_array($role, $allowedRoles, true)) {
    $role = 'editor';
}

try {
    $pdo = db();
    $duplicate = $pdo->prepare('SELECT id FROM admin_users WHERE username = :username LIMIT 1');
    $duplicate->execute(['username' => $username]);

    if ($duplicate->fetch()) {
        header('Location: admin-register.html?register=duplicate');
        exit;
    }

    $currentAdmin = current_admin();
    $createdBy = $currentAdmin['id'] ?? null;

    $stmt = $pdo->prepare(
        'INSERT INTO admin_users (username, password_hash, full_name, role, created_by, updated_by)
         VALUES (:username, :password_hash, :full_name, :role, :created_by, :updated_by)'
    );

    $stmt->execute([
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'full_name' => $fullName,
        'role' => $role,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
    ]);

    $newId = (int)$pdo->lastInsertId();
    write_admin_log(
        $createdBy ? (int)$createdBy : $newId,
        'create_admin',
        'admin_user',
        (string)$newId,
        $username,
        'ลงทะเบียนผู้ดูแลระบบ ' . $fullName
    );

    header('Location: admin-register.html?register=success');
    exit;
} catch (Throwable $error) {
    header('Location: admin-register.html?register=db_error');
    exit;
}
