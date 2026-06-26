<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/api.php';

$admin = require_admin_json();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'list' : 'save');
$allowedTypes = ['public', 'job', 'procurement'];
$allowedStatuses = ['draft', 'published', 'archived'];

function map_news_row(array $row): array
{
    return [
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
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

try {
    if ($action === 'list') {
        $stmt = db()->query(
            'SELECT *
             FROM news_items
             ORDER BY sort_order DESC, COALESCE(publish_date, DATE(created_at)) DESC, id DESC'
        );
        send_json(['ok' => true, 'news' => array_map('map_news_row', $stmt->fetchAll())]);
    }

    $data = request_data();

    if ($action === 'save') {
        $id = text_value($data, 'id');
        $type = in_array(($data['type'] ?? 'public'), $allowedTypes, true) ? (string)$data['type'] : 'public';
        $status = in_array(($data['status'] ?? 'published'), $allowedStatuses, true) ? (string)$data['status'] : 'published';
        $title = text_value($data, 'title');
        $summary = text_value($data, 'summary');
        $displayDate = nullable_text($data, 'date');

        if ($title === '' || $summary === '') {
            send_json(['ok' => false, 'message' => 'กรุณากรอกหัวข้อและรายละเอียดสั้น'], 422);
        }

        $payload = [
            'news_type' => $type,
            'title' => $title,
            'summary' => $summary,
            'category' => nullable_text($data, 'category'),
            'publish_date' => display_date_to_sql($displayDate),
            'display_date' => $displayDate,
            'author' => nullable_text($data, 'author'),
            'image_url' => nullable_text($data, 'image'),
            'announcement_no' => nullable_text($data, 'announcementNo'),
            'display_status' => nullable_text($data, 'displayStatus'),
            'meta_one' => nullable_text($data, 'metaOne'),
            'meta_two' => nullable_text($data, 'metaTwo'),
            'status' => $status,
            'updated_by' => (int)$admin['id'],
            'published_at' => $status === 'published' ? date('Y-m-d H:i:s') : null,
        ];

        if ($id !== '') {
            $stmt = db()->prepare(
                'UPDATE news_items
                 SET news_type = :news_type, title = :title, summary = :summary, category = :category,
                     publish_date = :publish_date, display_date = :display_date, author = :author,
                     image_url = :image_url, announcement_no = :announcement_no, display_status = :display_status,
                     meta_one = :meta_one, meta_two = :meta_two, status = :status, updated_by = :updated_by,
                     published_at = CASE WHEN :status_for_publish = "published" THEN COALESCE(published_at, :published_at) ELSE published_at END
                 WHERE id = :id'
            );
            $stmt->execute([...$payload, 'status_for_publish' => $status, 'id' => (int)$id]);
            write_admin_log((int)$admin['id'], 'update_news', 'news_item', $id, $title, 'แก้ไขข่าว ' . $title);

            send_json(['ok' => true, 'message' => 'บันทึกข่าวเรียบร้อยแล้ว']);
        }

        $maxSort = (int)db()->query('SELECT COALESCE(MAX(sort_order), 0) FROM news_items')->fetchColumn();
        $stmt = db()->prepare(
            'INSERT INTO news_items
                (news_type, title, summary, category, publish_date, display_date, author, image_url,
                 announcement_no, display_status, meta_one, meta_two, status, sort_order, created_by, updated_by, published_at)
             VALUES
                (:news_type, :title, :summary, :category, :publish_date, :display_date, :author, :image_url,
                 :announcement_no, :display_status, :meta_one, :meta_two, :status, :sort_order, :created_by, :updated_by, :published_at)'
        );
        $stmt->execute([...$payload, 'sort_order' => $maxSort + 10, 'created_by' => (int)$admin['id']]);

        $newId = (string)db()->lastInsertId();
        write_admin_log((int)$admin['id'], 'create_news', 'news_item', $newId, $title, 'เพิ่มข่าว ' . $title);

        send_json(['ok' => true, 'message' => 'บันทึกข่าวเรียบร้อยแล้ว']);
    }

    if ($action === 'delete') {
        $id = text_value($data, 'id');
        if ($id === '') {
            send_json(['ok' => false, 'message' => 'ไม่พบรหัสข่าว'], 422);
        }

        $stmt = db()->prepare('SELECT title FROM news_items WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (int)$id]);
        $item = $stmt->fetch();
        if (!$item) {
            send_json(['ok' => false, 'message' => 'ไม่พบข่าว'], 404);
        }

        db()->prepare('DELETE FROM news_items WHERE id = :id')->execute(['id' => (int)$id]);
        write_admin_log((int)$admin['id'], 'delete_news', 'news_item', $id, $item['title'], 'ลบข่าว ' . $item['title']);

        send_json(['ok' => true, 'message' => 'ลบข่าวเรียบร้อยแล้ว']);
    }

    send_json(['ok' => false, 'message' => 'Invalid action'], 400);
} catch (Throwable $error) {
    send_json(['ok' => false, 'message' => 'Database error'], 500);
}

