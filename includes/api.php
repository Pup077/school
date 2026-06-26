<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

function send_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_admin_json(): array
{
    $admin = current_admin();
    if (!$admin) {
        send_json(['ok' => false, 'message' => 'Unauthorized'], 401);
    }

    return $admin;
}

function request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : [];
    }

    return $_POST;
}

function text_value(array $data, string $key, string $default = ''): string
{
    return trim((string)($data[$key] ?? $default));
}

function nullable_text(array $data, string $key): ?string
{
    $value = text_value($data, $key);
    return $value === '' ? null : $value;
}

function display_date_to_sql(?string $displayDate): ?string
{
    if (!$displayDate) {
        return null;
    }

    $date = DateTime::createFromFormat('Y-m-d', $displayDate);
    return $date ? $date->format('Y-m-d') : null;
}

