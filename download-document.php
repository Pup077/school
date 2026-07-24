<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/news_schema.php';

ensure_news_document_schema();

$documentId = max(0, (int)($_GET['document'] ?? 0));
$newsId = max(0, (int)($_GET['id'] ?? 0));
if ($documentId <= 0 && $newsId <= 0) {
    http_response_code(404);
    exit('Document not found');
}

$stmt = $documentId > 0
    ? db()->prepare(
        'SELECT ni.title, nd.document_url, nd.document_name
         FROM news_documents nd
         INNER JOIN news_items ni ON ni.id = nd.news_item_id
         WHERE nd.id = :id AND ni.status = "published"
         LIMIT 1'
    )
    : db()->prepare(
        'SELECT title, document_url, document_name
         FROM news_items
         WHERE id = :id AND status = "published" AND document_url IS NOT NULL AND document_url <> ""
         LIMIT 1'
    );
$stmt->execute(['id' => $documentId > 0 ? $documentId : $newsId]);
$item = $stmt->fetch();

if (!$item) {
    http_response_code(404);
    exit('Document not found');
}

$documentUrl = trim((string)$item['document_url']);
$documentName = trim((string)($item['document_name'] ?? ''));

if (preg_match('/^https?:\/\//i', $documentUrl)) {
    header('Location: ' . $documentUrl, true, 302);
    exit;
}

$urlPath = (string)(parse_url($documentUrl, PHP_URL_PATH) ?: $documentUrl);
$relativePath = ltrim(str_replace('\\', '/', rawurldecode($urlPath)), '/');
$baseDir = realpath(__DIR__ . '/uploads/documents');
$filePath = realpath(__DIR__ . '/' . $relativePath);

if (!$baseDir || !$filePath || !is_file($filePath) || strncmp($filePath, $baseDir, strlen($baseDir)) !== 0) {
    http_response_code(404);
    exit('Document not found');
}

$fallbackName = basename($filePath);
$downloadName = $documentName !== '' ? $documentName : $fallbackName;
$downloadName = str_replace(["\r", "\n", '"'], '', $downloadName);
if ($downloadName === '') {
    $downloadName = 'document';
}

$extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$mimeTypes = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
$mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
$asciiName = preg_replace('/[^\x20-\x7E]/', '_', $downloadName);
$asciiName = $asciiName !== '' ? $asciiName : $fallbackName;
$forceDownload = ($_GET['download'] ?? '') === '1';
$disposition = $extension === 'pdf' && !$forceDownload ? 'inline' : 'attachment';

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . (string)filesize($filePath));
header('Content-Disposition: ' . $disposition . '; filename="' . $asciiName . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=0, must-revalidate');

readfile($filePath);
