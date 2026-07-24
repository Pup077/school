<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/site_settings.php';

$admin = require_admin_json();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'get' : 'save');

try {
    if ($action === 'get') {
        send_json([
            'ok' => true,
            'settings' => [
                'noticeText' => site_setting('home_notice_text', ''),
            ],
        ]);
    }

    if ($action === 'save') {
        $data = request_data();
        $noticeText = trim((string)($data['noticeText'] ?? ''));
        save_site_setting('home_notice_text', $noticeText, (int)$admin['id']);
        write_admin_log((int)$admin['id'], 'update_site_notice', 'site_setting', 'home_notice_text', 'ประกาศหน้าแรก', 'แก้ไขข้อความประกาศหน้าแรก');
        send_json(['ok' => true, 'message' => 'บันทึกประกาศหน้าแรกเรียบร้อยแล้ว']);
    }

    send_json(['ok' => false, 'message' => 'Invalid action'], 400);
} catch (Throwable $error) {
    send_json(['ok' => false, 'message' => 'Database error'], 500);
}
