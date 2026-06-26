<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/api.php';

$admin = require_admin_json();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'GET' ? 'list' : 'save');

try {
    if ($action === 'list') {
        $stmt = db()->query(
            'SELECT id, username, full_name, role, is_active, last_login_at, created_at
             FROM admin_users
             ORDER BY created_at DESC, id DESC'
        );

        send_json([
            'ok' => true,
            'members' => array_map(static fn(array $row): array => [
                'id' => (string)$row['id'],
                'username' => $row['username'],
                'fullName' => $row['full_name'],
                'role' => $row['role'],
                'status' => (int)$row['is_active'] === 1 ? 'active' : 'inactive',
                'createdAt' => $row['created_at'],
                'lastLoginAt' => $row['last_login_at'],
            ], $stmt->fetchAll()),
            'currentAdminId' => (string)$admin['id'],
        ]);
    }

    $data = request_data();

    if ($action === 'save') {
        $id = text_value($data, 'id');
        $username = text_value($data, 'username');
        $fullName = text_value($data, 'fullName');
        $password = (string)($data['password'] ?? '');
        $role = in_array(($data['role'] ?? 'editor'), ['admin', 'editor'], true) ? (string)$data['role'] : 'editor';

        if ($username === '' || $fullName === '') {
            send_json(['ok' => false, 'message' => 'กรุณากรอกชื่อ-สกุลและชื่อผู้ใช้'], 422);
        }

        if ($id === '' && strlen($password) < 6) {
            send_json(['ok' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'], 422);
        }

        if ($password !== '' && strlen($password) < 6) {
            send_json(['ok' => false, 'message' => 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'], 422);
        }

        $duplicate = db()->prepare('SELECT id FROM admin_users WHERE username = :username AND (:id = "" OR id <> :id_check) LIMIT 1');
        $duplicate->execute(['username' => $username, 'id' => $id, 'id_check' => (int)$id]);
        if ($duplicate->fetch()) {
            send_json(['ok' => false, 'message' => 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว'], 409);
        }

        if ($id !== '') {
            $params = [
                'id' => (int)$id,
                'username' => $username,
                'full_name' => $fullName,
                'role' => $role,
                'updated_by' => (int)$admin['id'],
            ];
            $passwordSql = '';

            if ($password !== '') {
                $passwordSql = ', password_hash = :password_hash';
                $params['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
            }

            $stmt = db()->prepare(
                "UPDATE admin_users
                 SET username = :username, full_name = :full_name, role = :role, updated_by = :updated_by{$passwordSql}
                 WHERE id = :id"
            );
            $stmt->execute($params);
            write_admin_log((int)$admin['id'], 'update_admin', 'admin_user', $id, $username, 'แก้ไขสมาชิก Admin ' . $fullName);

            send_json(['ok' => true, 'message' => 'บันทึกสมาชิกเรียบร้อยแล้ว']);
        }

        $stmt = db()->prepare(
            'INSERT INTO admin_users (username, password_hash, full_name, role, created_by, updated_by)
             VALUES (:username, :password_hash, :full_name, :role, :created_by, :updated_by)'
        );
        $stmt->execute([
            'username' => $username,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'full_name' => $fullName,
            'role' => $role,
            'created_by' => (int)$admin['id'],
            'updated_by' => (int)$admin['id'],
        ]);

        $newId = (string)db()->lastInsertId();
        write_admin_log((int)$admin['id'], 'create_admin', 'admin_user', $newId, $username, 'เพิ่มสมาชิก Admin ' . $fullName);

        send_json(['ok' => true, 'message' => 'บันทึกสมาชิกเรียบร้อยแล้ว']);
    }

    if ($action === 'toggle') {
        $id = text_value($data, 'id');
        if ($id === '' || (int)$id === (int)$admin['id']) {
            send_json(['ok' => false, 'message' => 'ไม่สามารถเปลี่ยนสถานะบัญชีที่ใช้งานอยู่'], 422);
        }

        $stmt = db()->prepare('SELECT username, full_name, is_active FROM admin_users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (int)$id]);
        $member = $stmt->fetch();
        if (!$member) {
            send_json(['ok' => false, 'message' => 'ไม่พบสมาชิก'], 404);
        }

        $nextStatus = (int)$member['is_active'] === 1 ? 0 : 1;
        db()->prepare('UPDATE admin_users SET is_active = :status, updated_by = :updated_by WHERE id = :id')
            ->execute(['status' => $nextStatus, 'updated_by' => (int)$admin['id'], 'id' => (int)$id]);

        write_admin_log((int)$admin['id'], 'toggle_admin_status', 'admin_user', $id, $member['username'], ($nextStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน') . 'สมาชิก Admin ' . $member['full_name']);
        send_json(['ok' => true, 'message' => 'อัปเดตสถานะสมาชิกเรียบร้อยแล้ว']);
    }

    if ($action === 'delete') {
        $id = text_value($data, 'id');
        if ($id === '' || (int)$id === (int)$admin['id']) {
            send_json(['ok' => false, 'message' => 'ไม่สามารถลบบัญชีที่ใช้งานอยู่'], 422);
        }

        $stmt = db()->prepare('SELECT username, full_name FROM admin_users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (int)$id]);
        $member = $stmt->fetch();
        if (!$member) {
            send_json(['ok' => false, 'message' => 'ไม่พบสมาชิก'], 404);
        }

        db()->prepare('DELETE FROM admin_users WHERE id = :id')->execute(['id' => (int)$id]);
        write_admin_log((int)$admin['id'], 'delete_admin', 'admin_user', $id, $member['username'], 'ลบสมาชิก Admin ' . $member['full_name']);

        send_json(['ok' => true, 'message' => 'ลบสมาชิกเรียบร้อยแล้ว']);
    }

    send_json(['ok' => false, 'message' => 'Invalid action'], 400);
} catch (Throwable $error) {
    send_json(['ok' => false, 'message' => 'Database error'], 500);
}
