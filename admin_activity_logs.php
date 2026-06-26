<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!current_admin()) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 5;
    $offset = ($page - 1) * $perPage;
    $allowedActions = ['login', 'logout', 'create_news', 'update_news', 'delete_news'];
    $placeholders = implode(',', array_fill(0, count($allowedActions), '?'));

    $countStmt = db()->prepare("SELECT COUNT(1) FROM admin_activity_logs WHERE action IN ({$placeholders})");
    $countStmt->execute($allowedActions);
    $total = (int)$countStmt->fetchColumn();

    $stmt = db()->prepare(
        "SELECT
            logs.id,
            logs.action,
            logs.target_type,
            logs.target_id,
            logs.target_name,
            logs.detail,
            logs.ip_address,
            logs.created_at,
            users.username AS actor_username,
            users.full_name AS actor_name
         FROM admin_activity_logs AS logs
         LEFT JOIN admin_users AS users ON users.id = logs.admin_user_id
         WHERE logs.action IN ({$placeholders})
         ORDER BY logs.created_at DESC, logs.id DESC
         LIMIT {$perPage} OFFSET {$offset}"
    );
    $stmt->execute($allowedActions);

    echo json_encode([
        'ok' => true,
        'page' => $page,
        'perPage' => $perPage,
        'total' => $total,
        'totalPages' => max(1, (int)ceil($total / $perPage)),
        'logs' => array_map(static fn(array $row): array => [
            'id' => (string)$row['id'],
            'action' => $row['action'],
            'targetType' => $row['target_type'],
            'targetId' => $row['target_id'],
            'targetName' => $row['target_name'] ?: '-',
            'detail' => $row['detail'] ?: '',
            'ipAddress' => $row['ip_address'] ?: '-',
            'actorUsername' => $row['actor_username'] ?: $row['target_name'] ?: '-',
            'actorName' => $row['actor_name'] ?: $row['target_name'] ?: 'ผู้ดูแลระบบ',
            'createdAt' => $row['created_at'],
        ], $stmt->fetchAll()),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database error'], JSON_UNESCAPED_UNICODE);
}
