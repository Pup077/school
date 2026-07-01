<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/news_schema.php';

ensure_news_document_schema();

function send_public_news_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function document_name_from_url(?string $url): ?string
{
    $url = trim((string)$url);
    if ($url === '') {
        return null;
    }

    $path = parse_url($url, PHP_URL_PATH);
    $name = basename(str_replace('\\', '/', (string)($path ?: $url)));
    return $name !== '' ? rawurldecode($name) : null;
}

function document_from_legacy_fields(array $row): ?array
{
    $url = trim((string)($row['document_url'] ?? ''));
    if ($url === '') {
        return null;
    }

    return [
        'id' => (string)$row['id'],
        'newsId' => (string)$row['id'],
        'url' => $url,
        'name' => $row['document_name'] ?? document_name_from_url($url) ?? '',
        'legacy' => true,
    ];
}

function fetch_public_news_documents(array $newsIds): array
{
    $ids = array_values(array_unique(array_filter(array_map('intval', $newsIds))));
    if (!$ids) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = db()->prepare(
        "SELECT id, news_item_id, document_url, document_name
         FROM news_documents
         WHERE news_item_id IN ({$placeholders})
         ORDER BY sort_order ASC, id ASC"
    );
    $stmt->execute($ids);

    $documents = [];
    foreach ($stmt->fetchAll() as $row) {
        $newsId = (string)$row['news_item_id'];
        $documents[$newsId][] = [
            'id' => (string)$row['id'],
            'newsId' => $newsId,
            'url' => $row['document_url'] ?? '',
            'name' => $row['document_name'] ?? document_name_from_url($row['document_url'] ?? null) ?? '',
        ];
    }

    return $documents;
}

try {
    $stmt = db()->query(
        'SELECT *
         FROM news_items
         WHERE status = "published"
         ORDER BY sort_order DESC, COALESCE(publish_date, DATE(created_at)) DESC, id DESC'
    );

    $rows = $stmt->fetchAll();
    $documentsByNewsId = fetch_public_news_documents(array_column($rows, 'id'));

    $items = array_map(static function (array $row) use ($documentsByNewsId): array {
        $documents = $documentsByNewsId[(string)$row['id']] ?? [];
        if (!$documents) {
            $legacyDocument = document_from_legacy_fields($row);
            $documents = $legacyDocument ? [$legacyDocument] : [];
        }

        return [
            'id' => (string)$row['id'],
            'type' => $row['news_type'],
            'title' => $row['title'],
            'summary' => $row['summary'],
            'category' => $row['category'] ?? '',
            'date' => $row['display_date'] ?: ($row['publish_date'] ?? ''),
            'publishDate' => $row['publish_date'] ?? '',
            'author' => $row['author'] ?? '',
            'image' => $row['image_url'] ?? '',
            'documentUrl' => $row['document_url'] ?? '',
            'documentName' => $row['document_name'] ?? '',
            'documents' => $documents,
            'announcementNo' => $row['announcement_no'] ?? '',
            'displayStatus' => $row['display_status'] ?? '',
            'metaOne' => $row['meta_one'] ?? '',
            'metaTwo' => $row['meta_two'] ?? '',
            'status' => $row['status'],
            'updatedAt' => $row['updated_at'],
        ];
    }, $rows);

    send_public_news_json(['ok' => true, 'news' => $items]);
} catch (Throwable $error) {
    send_public_news_json(['ok' => false, 'message' => 'Database error'], 500);
}
