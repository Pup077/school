<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$admin = current_admin();

echo json_encode([
    'ok' => true,
    'loggedIn' => $admin !== null,
    'remainingSeconds' => $admin ? admin_session_remaining_seconds() : 0,
    'user' => $admin ? [
        'username' => $admin['username'],
        'fullName' => $admin['full_name'],
        'role' => $admin['role'],
    ] : null,
], JSON_UNESCAPED_UNICODE);

