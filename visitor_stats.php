<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';

function send_visitor_stats_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function visitor_client_ip(): string
{
    foreach (['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        $value = $_SERVER[$key] ?? '';
        if ($value !== '') {
            return trim(explode(',', $value)[0]);
        }
    }

    return 'unknown';
}

try {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $pdo = db();
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS site_visits (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_key VARCHAR(128) NOT NULL,
            ip_hash CHAR(64) NOT NULL,
            user_agent VARCHAR(255) NULL,
            page VARCHAR(120) NOT NULL,
            visit_date DATE NOT NULL,
            visited_at DATETIME NOT NULL,
            last_seen_at DATETIME NOT NULL,
            UNIQUE KEY uniq_visit_session_page_day (session_key, page, visit_date),
            KEY idx_visit_date (visit_date),
            KEY idx_last_seen_at (last_seen_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $page = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string)($_GET['page'] ?? 'index'));
    $page = $page !== '' ? mb_substr($page, 0, 120) : 'index';
    $now = date('Y-m-d H:i:s');
    $today = date('Y-m-d');
    $sessionKey = session_id() ?: bin2hex(random_bytes(16));
    $ipHash = hash('sha256', visitor_client_ip());
    $userAgent = mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    $stmt = $pdo->prepare(
        'INSERT INTO site_visits
            (session_key, ip_hash, user_agent, page, visit_date, visited_at, last_seen_at)
         VALUES
            (:session_key, :ip_hash, :user_agent, :page, :visit_date, :visited_at, :last_seen_at)
         ON DUPLICATE KEY UPDATE
            last_seen_at = VALUES(last_seen_at),
            user_agent = VALUES(user_agent)'
    );
    $stmt->execute([
        ':session_key' => $sessionKey,
        ':ip_hash' => $ipHash,
        ':user_agent' => $userAgent,
        ':page' => $page,
        ':visit_date' => $today,
        ':visited_at' => $now,
        ':last_seen_at' => $now,
    ]);

    $totalVisits = (int)$pdo->query('SELECT COUNT(*) FROM site_visits')->fetchColumn();

    $todayStmt = $pdo->prepare('SELECT COUNT(*) FROM site_visits WHERE visit_date = :today');
    $todayStmt->execute([':today' => $today]);
    $todayVisits = (int)$todayStmt->fetchColumn();

    $onlineStmt = $pdo->prepare(
        'SELECT COUNT(DISTINCT session_key)
         FROM site_visits
         WHERE last_seen_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)'
    );
    $onlineStmt->execute();
    $onlineVisitors = (int)$onlineStmt->fetchColumn();

    send_visitor_stats_json([
        'ok' => true,
        'stats' => [
            'total' => $totalVisits,
            'today' => $todayVisits,
            'online' => $onlineVisitors,
            'updatedAt' => $now,
        ],
    ]);
} catch (Throwable $error) {
    send_visitor_stats_json([
        'ok' => false,
        'message' => 'Visitor stats unavailable',
    ], 500);
}
