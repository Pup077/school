<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/site_settings.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    echo json_encode([
        'ok' => true,
        'settings' => [
            'noticeText' => site_setting('home_notice_text', ''),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database error'], JSON_UNESCAPED_UNICODE);
}
