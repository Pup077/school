<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = db();
    $version = $pdo->query('SELECT VERSION() AS version')->fetch();
    echo "เชื่อมต่อฐานข้อมูลสำเร็จ\n";
    echo 'Database: ' . DB_NAME . "\n";
    echo 'MySQL/MariaDB: ' . ($version['version'] ?? '-') . "\n";
} catch (Throwable $error) {
    http_response_code(500);
    echo "เชื่อมต่อฐานข้อมูลไม่สำเร็จ\n";
    echo $error->getMessage() . "\n";
}

