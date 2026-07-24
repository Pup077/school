<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/calendar_schema.php';

$admin = require_admin_json();
set_exception_handler(static function (Throwable $error): void {
    error_log('Calendar API error: ' . $error->getMessage());
    send_json(['ok' => false, 'message' => 'บันทึกปฏิทินไม่สำเร็จ กรุณาตรวจสอบฐานข้อมูล'], 500);
});
ensure_calendar_schema();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'list' : 'save');

if ($action === 'list') {
    $rows = db()->query('SELECT id, title, description, event_date, event_type, status FROM calendar_events ORDER BY event_date DESC, id DESC')->fetchAll();
    $events = array_map(static fn(array $row): array => [
        'id' => (string)$row['id'], 'title' => $row['title'], 'description' => $row['description'] ?? '',
        'date' => $row['event_date'], 'type' => $row['event_type'], 'status' => $row['status'],
    ], $rows);
    send_json(['ok' => true, 'events' => $events]);
}

$data = request_data();
$id = (int)($data['id'] ?? 0);
if ($action === 'delete') {
    if ($id < 1) send_json(['ok' => false, 'message' => 'ไม่พบรายการ'], 422);
    $nameStmt = db()->prepare('SELECT title FROM calendar_events WHERE id = :id');
    $nameStmt->execute(['id' => $id]);
    $targetName = (string)($nameStmt->fetchColumn() ?: 'กิจกรรมปฏิทิน');
    db()->prepare('DELETE FROM calendar_events WHERE id = :id')->execute(['id' => $id]);
    write_admin_log((int)$admin['id'], 'delete_calendar', 'calendar_event', (string)$id, $targetName, 'ลบกิจกรรมปฏิทิน ' . $targetName);
    send_json(['ok' => true, 'message' => 'ลบกิจกรรมเรียบร้อยแล้ว']);
}

$title = text_value($data, 'title');
$description = nullable_text($data, 'description');
$date = display_date_to_sql(text_value($data, 'date'));
$type = text_value($data, 'type', 'school');
$status = text_value($data, 'status', 'published');
if ($title === '' || !$date) send_json(['ok' => false, 'message' => 'กรุณาระบุชื่อและวันที่'], 422);
if (!in_array($type, ['school', 'holiday', 'important'], true)) $type = 'school';
if (!in_array($status, ['draft', 'published'], true)) $status = 'published';

if ($id > 0) {
    $stmt = db()->prepare('UPDATE calendar_events SET title=:title, description=:description, event_date=:event_date, event_type=:event_type, status=:status, updated_by=:admin WHERE id=:id');
    $stmt->execute(['title'=>$title, 'description'=>$description, 'event_date'=>$date, 'event_type'=>$type, 'status'=>$status, 'admin'=>$admin['id'], 'id'=>$id]);
    write_admin_log((int)$admin['id'], 'update_calendar', 'calendar_event', (string)$id, $title, 'แก้ไขกิจกรรมปฏิทิน ' . $title);
    send_json(['ok' => true, 'message' => 'แก้ไขกิจกรรมเรียบร้อยแล้ว']);
}

$stmt = db()->prepare('INSERT INTO calendar_events (title, description, event_date, event_type, status, created_by, updated_by) VALUES (:title,:description,:event_date,:event_type,:status,:created_by,:updated_by)');
$stmt->execute([
    'title' => $title,
    'description' => $description,
    'event_date' => $date,
    'event_type' => $type,
    'status' => $status,
    'created_by' => $admin['id'],
    'updated_by' => $admin['id'],
]);
$newId = (string)db()->lastInsertId();
write_admin_log((int)$admin['id'], 'create_calendar', 'calendar_event', $newId, $title, 'เพิ่มกิจกรรมปฏิทิน ' . $title);
send_json(['ok' => true, 'id' => $newId, 'message' => 'เพิ่มกิจกรรมเรียบร้อยแล้ว']);
