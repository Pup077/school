<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/calendar_schema.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    ensure_calendar_schema();
    $stmt = db()->query('SELECT id, title, description, event_date, event_type FROM calendar_events WHERE status = "published" ORDER BY event_date ASC, id ASC');
    $events = array_map(static fn(array $row): array => [
        'id' => (string)$row['id'],
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'date' => $row['event_date'],
        'type' => $row['event_type'],
        'source' => 'admin',
    ], $stmt->fetchAll());
    echo json_encode(['ok' => true, 'events' => $events], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database error'], JSON_UNESCAPED_UNICODE);
}
