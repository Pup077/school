<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/library_schema.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
try {
    ensure_library_schema();
    $category = ($_GET['category'] ?? '') === 'student_form' ? 'student_form' : 'curriculum';
    $stmt = db()->prepare('SELECT id, title, author, view_count, updated_at FROM library_documents WHERE category=:category AND status="published" ORDER BY updated_at DESC, id DESC');
    $stmt->execute(['category'=>$category]);
    echo json_encode(['ok'=>true, 'documents'=>array_map(static fn(array $row): array => [
        'id'=>(string)$row['id'], 'title'=>$row['title'], 'author'=>$row['author'] ?: 'ผู้ดูแลระบบ',
        'views'=>(int)$row['view_count'], 'updatedAt'=>$row['updated_at'],
    ], $stmt->fetchAll())], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'message'=>'โหลดคลังเอกสารไม่สำเร็จ'], JSON_UNESCAPED_UNICODE);
}
