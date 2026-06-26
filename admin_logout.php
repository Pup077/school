<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

$admin = current_admin();
if ($admin) {
    write_admin_log((int)$admin['id'], 'logout', 'admin_user', (string)$admin['id'], $admin['username'], 'ออกจากระบบผู้ดูแล');
}

expire_admin_session();

header('Location: index.html?logout=success');
exit;
