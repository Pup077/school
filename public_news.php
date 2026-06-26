<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';

function send_public_news_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = db()->query(
        'SELECT *
         FROM news_items
         WHERE status = "published"
         ORDER BY sort_order DESC, COALESCE(publish_date, DATE(created_at)) DESC, id DESC'
    );

    $items = array_map(static fn(array $row): array => [
        'id' => (string)$row['id'],
        'type' => $row['news_type'],
        'title' => $row['title'],
        'summary' => $row['summary'],
        'category' => $row['category'] ?? '',
        'date' => $row['display_date'] ?: ($row['publish_date'] ?? ''),
        'author' => $row['author'] ?? '',
        'image' => $row['image_url'] ?? '',
        'announcementNo' => $row['announcement_no'] ?? '',
        'displayStatus' => $row['display_status'] ?? '',
        'metaOne' => $row['meta_one'] ?? '',
        'metaTwo' => $row['meta_two'] ?? '',
        'status' => $row['status'],
    ], $stmt->fetchAll());

    send_public_news_json(['ok' => true, 'news' => $items]);
} catch (Throwable $error) {
    send_public_news_json(['ok' => false, 'message' => 'Database error'], 500);
}
