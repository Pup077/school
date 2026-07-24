<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/library_schema.php';
ensure_library_schema();
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) { http_response_code(404); exit('ไม่พบเอกสาร'); }
$stmt=db()->prepare('SELECT pdf_url, original_name FROM library_documents WHERE id=:id AND status="published"');
$stmt->execute(['id'=>$id]); $item=$stmt->fetch();
if (!$item) { http_response_code(404); exit('ไม่พบเอกสาร'); }
$relative=ltrim(str_replace('\\','/',(string)$item['pdf_url']),'/');
$path=realpath(__DIR__.'/'.$relative); $root=realpath(__DIR__.'/uploads/library');
if (!$path || !$root || !str_starts_with($path,$root) || !is_file($path)) { http_response_code(404); exit('ไม่พบไฟล์'); }
$name=preg_replace('/[^A-Za-z0-9ก-๙._ -]/u','_',($item['original_name'] ?: basename($path)));
$disposition = ($_GET['download'] ?? '') === '1' ? 'attachment' : 'inline';
header('Content-Type: application/pdf');
header('Content-Disposition: '.$disposition.'; filename="document.pdf"; filename*=UTF-8\'\''.rawurlencode($name));
header('Content-Length: '.filesize($path));
readfile($path);
