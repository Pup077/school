<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/news_schema.php';

$admin = require_admin_json();
ensure_news_document_schema();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'list' : 'save');
$allowedTypes = ['public', 'job', 'procurement'];
$allowedStatuses = ['draft', 'published', 'archived'];

function uploaded_news_image_path(): ?string
{
    if (empty($_FILES['imageFile']) || !is_array($_FILES['imageFile'])) {
        return null;
    }

    $file = $_FILES['imageFile'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'message' => 'อัปโหลดรูปภาพไม่สำเร็จ'], 422);
    }

    if (($file['size'] ?? 0) > 3 * 1024 * 1024) {
        send_json(['ok' => false, 'message' => 'รูปภาพต้องมีขนาดไม่เกิน 3MB'], 422);
    }

    $tmpPath = (string)($file['tmp_name'] ?? '');
    $mimeType = is_file($tmpPath) ? mime_content_type($tmpPath) : '';
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($extensions[$mimeType])) {
        send_json(['ok' => false, 'message' => 'รองรับเฉพาะไฟล์ jpg, png และ webp'], 422);
    }

    $uploadDir = __DIR__ . '/uploads/news';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $filename = date('YmdHis') . '-' . bin2hex(random_bytes(8)) . '.' . $extensions[$mimeType];
    $targetPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
        if (!rename($tmpPath, $targetPath)) {
            send_json(['ok' => false, 'message' => 'บันทึกไฟล์รูปภาพไม่สำเร็จ'], 500);
        }
    }

    return 'uploads/news/' . $filename;
}

function save_uploaded_news_document(array $file): ?array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'message' => 'อัปโหลดเอกสารไม่สำเร็จ'], 422);
    }

    if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
        send_json(['ok' => false, 'message' => 'เอกสารต้องมีขนาดไม่เกิน 10MB'], 422);
    }

    $originalName = trim(str_replace('\\', '/', (string)($file['name'] ?? '')));
    $originalName = basename($originalName);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['pdf', 'doc', 'docx'];
    if (!in_array($extension, $allowedExtensions, true)) {
        send_json(['ok' => false, 'message' => 'รองรับเฉพาะไฟล์ pdf, doc และ docx'], 422);
    }

    $tmpPath = (string)($file['tmp_name'] ?? '');
    $mimeType = is_file($tmpPath) ? (string)mime_content_type($tmpPath) : '';
    $allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream',
        'application/zip',
    ];

    if ($mimeType !== '' && !in_array($mimeType, $allowedMimes, true)) {
        send_json(['ok' => false, 'message' => 'ชนิดไฟล์เอกสารไม่ถูกต้อง'], 422);
    }

    $uploadDir = __DIR__ . '/uploads/documents';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $filename = date('YmdHis') . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
    $targetPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
        if (!rename($tmpPath, $targetPath)) {
            send_json(['ok' => false, 'message' => 'บันทึกไฟล์เอกสารไม่สำเร็จ'], 500);
        }
    }

    return [
        'url' => 'uploads/documents/' . $filename,
        'name' => $originalName !== '' ? $originalName : $filename,
    ];
}

function uploaded_news_documents(): array
{
    if (empty($_FILES['documentFile']) || !is_array($_FILES['documentFile'])) {
        return [];
    }

    $fileSet = $_FILES['documentFile'];
    $names = $fileSet['name'] ?? null;
    if (!is_array($names)) {
        $document = save_uploaded_news_document($fileSet);
        return $document ? [$document] : [];
    }

    if (count(array_filter($names, static fn($name): bool => trim((string)$name) !== '')) > 10) {
        send_json(['ok' => false, 'message' => 'อัปโหลดเอกสารได้ไม่เกิน 10 ไฟล์ต่อข่าว'], 422);
    }

    $documents = [];
    foreach ($names as $index => $name) {
        $document = save_uploaded_news_document([
            'name' => $name,
            'type' => $fileSet['type'][$index] ?? '',
            'tmp_name' => $fileSet['tmp_name'][$index] ?? '',
            'error' => $fileSet['error'][$index] ?? UPLOAD_ERR_NO_FILE,
            'size' => $fileSet['size'][$index] ?? 0,
        ]);
        if ($document) {
            $documents[] = $document;
        }
    }

    return $documents;
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
    ];
}

function fetch_news_documents(array $newsIds): array
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

function replace_news_documents(int $newsId, array $documents): void
{
    db()->prepare('DELETE FROM news_documents WHERE news_item_id = :news_id')->execute(['news_id' => $newsId]);
    if (!$documents) {
        return;
    }

    $stmt = db()->prepare(
        'INSERT INTO news_documents (news_item_id, document_url, document_name, sort_order)
         VALUES (:news_item_id, :document_url, :document_name, :sort_order)'
    );
    foreach ($documents as $index => $document) {
        $stmt->execute([
            'news_item_id' => $newsId,
            'document_url' => $document['url'] ?? '',
            'document_name' => $document['name'] ?? document_name_from_url($document['url'] ?? null),
            'sort_order' => ($index + 1) * 10,
        ]);
    }
}

function map_news_row(array $row, array $documents = []): array
{
    if (!$documents) {
        $legacyDocument = document_from_legacy_fields($row);
        $documents = $legacyDocument ? [$legacyDocument] : [];
    }

    return [
        'id' => (string)$row['id'],
        'type' => $row['news_type'],
        'title' => $row['title'],
        'summary' => $row['summary'],
        'content' => $row['content'] ?? '',
        'category' => $row['category'] ?? '',
        'date' => $row['display_date'] ?: ($row['publish_date'] ?? ''),
        'publishDate' => $row['publish_date'] ?? '',
        'author' => $row['author'] ?? '',
        'image' => $row['image_url'] ?? '',
        'documentUrl' => $row['document_url'] ?? '',
        'documentName' => $row['document_name'] ?? document_name_from_url($row['document_url'] ?? null) ?? '',
        'documents' => $documents,
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
        $rows = $stmt->fetchAll();
        $documents = fetch_news_documents(array_column($rows, 'id'));
        send_json([
            'ok' => true,
            'news' => array_map(static fn(array $row): array => map_news_row($row, $documents[(string)$row['id']] ?? []), $rows),
            'currentAdmin' => [
                'id' => (string)$admin['id'],
                'username' => $admin['username'] ?? '',
                'fullName' => $admin['full_name'] ?? ($admin['username'] ?? ''),
            ],
        ]);
    }

    $data = request_data();

    if ($action === 'save') {
        $id = text_value($data, 'id');
        $type = in_array(($data['type'] ?? 'public'), $allowedTypes, true) ? (string)$data['type'] : 'public';
        $status = in_array(($data['status'] ?? 'published'), $allowedStatuses, true) ? (string)$data['status'] : 'published';
        $title = text_value($data, 'title');
        $summary = text_value($data, 'summary');
        $displayDate = nullable_text($data, 'date');
        $publishDate = nullable_text($data, 'publishDate') ?: display_date_to_sql($displayDate);
        $category = nullable_text($data, 'category');
        $displayStatus = nullable_text($data, 'displayStatus');
        $hasContent = array_key_exists('content', $data);
        $uploadedImage = $type === 'public' ? uploaded_news_image_path() : null;
        $uploadedDocuments = $type !== 'public' ? uploaded_news_documents() : [];
        $firstUploadedDocument = $uploadedDocuments[0] ?? null;

        if ($title === '' || $summary === '') {
            send_json(['ok' => false, 'message' => 'กรุณากรอกหัวข้อและรายละเอียดสั้น'], 422);
        }

        if ($type === 'public') {
            $category = in_array($category, ['ข่าวเด่น', 'ข่าวประชาสัมพันธ์'], true) ? $category : 'ข่าวเด่น';
            $displayStatus = null;
            $documentUrl = null;
            $documentName = null;
            $imageUrl = $uploadedImage ?: nullable_text($data, 'image');
        } elseif ($type === 'job') {
            $category = in_array($category, ['สมัครงาน', 'สมัครเรียน'], true) ? $category : 'สมัครงาน';
            $displayStatus = in_array($displayStatus, ['กำลังรับสมัคร', 'ปิดรับสมัคร'], true) ? $displayStatus : 'กำลังรับสมัคร';
            $documentUrl = $firstUploadedDocument['url'] ?? nullable_text($data, 'document');
            $documentName = $firstUploadedDocument['name'] ?? nullable_text($data, 'documentName') ?? document_name_from_url($documentUrl);
            $imageUrl = null;
        } elseif ($type === 'procurement') {
            $category = null;
            $displayStatus = in_array($displayStatus, ['อยู่ระหว่างจัดซื้อ', 'จัดซื้อเสร็จสิ้น'], true) ? $displayStatus : 'อยู่ระหว่างจัดซื้อ';
            $documentUrl = $firstUploadedDocument['url'] ?? nullable_text($data, 'document');
            $documentName = $firstUploadedDocument['name'] ?? nullable_text($data, 'documentName') ?? document_name_from_url($documentUrl);
            $imageUrl = null;
        }

        $payload = [
            'news_type' => $type,
            'title' => $title,
            'summary' => $summary,
            'content' => $hasContent ? nullable_text($data, 'content') : null,
            'category' => $category,
            'publish_date' => $publishDate,
            'display_date' => $displayDate,
            'author' => $admin['full_name'] ?? ($admin['username'] ?? ''),
            'image_url' => $imageUrl,
            'document_url' => $documentUrl,
            'document_name' => $documentName,
            'announcement_no' => null,
            'display_status' => $displayStatus,
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
                     image_url = :image_url, document_url = :document_url, document_name = :document_name,
                     announcement_no = :announcement_no, display_status = :display_status,
                     meta_one = :meta_one, meta_two = :meta_two,
                     content = CASE WHEN :has_content = 1 THEN :content ELSE content END,
                     status = :status, updated_by = :updated_by,
                     published_at = CASE WHEN :status_for_publish = "published" THEN COALESCE(published_at, :published_at) ELSE published_at END
                 WHERE id = :id'
            );
            $stmt->execute([...$payload, 'has_content' => $hasContent ? 1 : 0, 'status_for_publish' => $status, 'id' => (int)$id]);
            if ($type === 'public') {
                replace_news_documents((int)$id, []);
            } elseif ($uploadedDocuments) {
                replace_news_documents((int)$id, $uploadedDocuments);
            } elseif ($documentUrl) {
                $existingDocuments = fetch_news_documents([(int)$id]);
                if (empty($existingDocuments[(string)(int)$id])) {
                    replace_news_documents((int)$id, [[
                        'url' => $documentUrl,
                        'name' => $documentName ?? document_name_from_url($documentUrl),
                    ]]);
                }
            }
            write_admin_log((int)$admin['id'], 'update_news', 'news_item', $id, $title, 'แก้ไขข่าว ' . $title);

            send_json(['ok' => true, 'message' => 'บันทึกข่าวเรียบร้อยแล้ว']);
        }

        $maxSort = (int)db()->query('SELECT COALESCE(MAX(sort_order), 0) FROM news_items')->fetchColumn();
        $stmt = db()->prepare(
            'INSERT INTO news_items
                (news_type, title, summary, category, publish_date, display_date, author, image_url, document_url, document_name,
                 announcement_no, display_status, meta_one, meta_two, content, status, sort_order, created_by, updated_by, published_at)
             VALUES
                (:news_type, :title, :summary, :category, :publish_date, :display_date, :author, :image_url, :document_url, :document_name,
                 :announcement_no, :display_status, :meta_one, :meta_two, :content, :status, :sort_order, :created_by, :updated_by, :published_at)'
        );
        $stmt->execute([...$payload, 'sort_order' => $maxSort + 10, 'created_by' => (int)$admin['id']]);

        $newId = (string)db()->lastInsertId();
        if ($type !== 'public') {
            $documentsToSave = $uploadedDocuments;
            if (!$documentsToSave && $documentUrl) {
                $documentsToSave = [[
                    'url' => $documentUrl,
                    'name' => $documentName ?? document_name_from_url($documentUrl),
                ]];
            }
            replace_news_documents((int)$newId, $documentsToSave);
        }
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
