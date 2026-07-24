<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/library_schema.php';
$admin = require_admin_json();
ensure_library_schema();
$action = $_GET['action'] ?? (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' ? 'list' : 'save');

try {
    if ($action === 'list') {
        $rows = db()->query('SELECT id, category, title, description, pdf_url, original_name, author, view_count, status, updated_at FROM library_documents ORDER BY updated_at DESC, id DESC')->fetchAll();
        send_json(['ok'=>true, 'documents'=>array_map(static fn(array $row): array => [
            'id'=>(string)$row['id'], 'category'=>$row['category'], 'title'=>$row['title'], 'description'=>$row['description'] ?? '',
            'pdfUrl'=>$row['pdf_url'], 'originalName'=>$row['original_name'] ?? '', 'author'=>$row['author'] ?? '',
            'views'=>(int)$row['view_count'], 'status'=>$row['status'], 'updatedAt'=>$row['updated_at'],
        ], $rows)]);
    }
    $data = request_data();
    $id = (int)($data['id'] ?? 0);
    if ($action === 'delete') {
        if ($id < 1) send_json(['ok'=>false, 'message'=>'ไม่พบเอกสาร'], 422);
        $nameStmt=db()->prepare('SELECT title FROM library_documents WHERE id=:id');$nameStmt->execute(['id'=>$id]);$targetName=(string)($nameStmt->fetchColumn()?:'เอกสาร');
        db()->prepare('DELETE FROM library_documents WHERE id=:id')->execute(['id'=>$id]);
        write_admin_log((int)$admin['id'],'delete_library','library_document',(string)$id,$targetName,'ลบเอกสาร '.$targetName);
        send_json(['ok'=>true, 'message'=>'ลบเอกสารเรียบร้อยแล้ว']);
    }
    $category = text_value($data, 'category') === 'student_form' ? 'student_form' : 'curriculum';
    $title = text_value($data, 'title');
    $description = nullable_text($data, 'description');
    $author = $admin['full_name'] ?? $admin['username'];
    $status = text_value($data, 'status') === 'draft' ? 'draft' : 'published';
    if ($title === '') send_json(['ok'=>false, 'message'=>'กรุณาระบุชื่อเอกสาร'], 422);
    $pdfUrl = null; $originalName = null;
    if (!empty($_FILES['pdfFile']) && ($_FILES['pdfFile']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['pdfFile'];
        if (($file['error'] ?? 1) !== UPLOAD_ERR_OK) send_json(['ok'=>false, 'message'=>'อัปโหลด PDF ไม่สำเร็จ'], 422);
        if (($file['size'] ?? 0) > 30 * 1024 * 1024) send_json(['ok'=>false, 'message'=>'ไฟล์ PDF ต้องไม่เกิน 30MB'], 422);
        $tmp = (string)$file['tmp_name'];
        if ((string)mime_content_type($tmp) !== 'application/pdf') send_json(['ok'=>false, 'message'=>'รองรับเฉพาะไฟล์ PDF'], 422);
        $dir = __DIR__ . '/uploads/library'; if (!is_dir($dir)) mkdir($dir, 0775, true);
        $name = date('YmdHis') . '-' . bin2hex(random_bytes(8)) . '.pdf';
        if (!move_uploaded_file($tmp, $dir . '/' . $name)) send_json(['ok'=>false, 'message'=>'จัดเก็บ PDF ไม่สำเร็จ'], 500);
        $pdfUrl = 'uploads/library/' . $name;
        $originalName = basename((string)$file['name']);
    }
    if ($id > 0) {
        $current = db()->prepare('SELECT pdf_url, original_name FROM library_documents WHERE id=:id'); $current->execute(['id'=>$id]); $row=$current->fetch();
        if (!$row) send_json(['ok'=>false, 'message'=>'ไม่พบเอกสาร'], 404);
        $pdfUrl = $pdfUrl ?: $row['pdf_url']; $originalName = $originalName ?: $row['original_name'];
        $stmt=db()->prepare('UPDATE library_documents SET category=:category,title=:title,description=:description,pdf_url=:pdf_url,original_name=:original_name,author=:author,status=:status,updated_by=:admin WHERE id=:id');
        $stmt->execute(['category'=>$category,'title'=>$title,'description'=>$description,'pdf_url'=>$pdfUrl,'original_name'=>$originalName,'author'=>$author,'status'=>$status,'admin'=>$admin['id'],'id'=>$id]);
        write_admin_log((int)$admin['id'],'update_library','library_document',(string)$id,$title,'แก้ไขเอกสาร '.$title);
        send_json(['ok'=>true,'message'=>'แก้ไขเอกสารเรียบร้อยแล้ว']);
    }
    if (!$pdfUrl) send_json(['ok'=>false,'message'=>'กรุณาเลือกไฟล์ PDF'], 422);
    $stmt=db()->prepare('INSERT INTO library_documents (category,title,description,pdf_url,original_name,author,status,created_by,updated_by) VALUES (:category,:title,:description,:pdf_url,:original_name,:author,:status,:created_by,:updated_by)');
    $stmt->execute(['category'=>$category,'title'=>$title,'description'=>$description,'pdf_url'=>$pdfUrl,'original_name'=>$originalName,'author'=>$author,'status'=>$status,'created_by'=>$admin['id'],'updated_by'=>$admin['id']]);
    $newId=(string)db()->lastInsertId();
    write_admin_log((int)$admin['id'],'create_library','library_document',$newId,$title,'เพิ่มเอกสาร '.$title);
    send_json(['ok'=>true,'message'=>'เพิ่มเอกสารเรียบร้อยแล้ว']);
} catch (Throwable $error) {
    error_log('Library API error: '.$error->getMessage());
    send_json(['ok'=>false,'message'=>'บันทึกคลังเอกสารไม่สำเร็จ'], 500);
}
