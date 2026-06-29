<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';

$id = max(0, (int)($_GET['id'] ?? 0));
$stmt = db()->prepare(
    'SELECT *
     FROM news_items
     WHERE id = :id AND status = "published"
     LIMIT 1'
);
$stmt->execute(['id' => $id]);
$item = $stmt->fetch();

if (!$item) {
    http_response_code(404);
}

function h(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function type_label(?string $type): string
{
    return match ($type) {
        'job' => 'ข่าวรับสมัครงาน',
        'procurement' => 'จัดซื้อจัดจ้าง',
        default => 'ข่าวประชาสัมพันธ์',
    };
}

function back_url(?string $type): string
{
    return match ($type) {
        'job' => 'jobs.html',
        'procurement' => 'procurement.html',
        default => 'news.html',
    };
}

function thai_datetime(?string $value): string
{
    if (!$value) {
        return '-';
    }

    $timestamp = strtotime($value);
    if (!$timestamp) {
        return $value;
    }

    return date('d/m/Y H:i', $timestamp);
}

$title = $item ? $item['title'] : 'ไม่พบข่าว';
$type = $item['news_type'] ?? 'public';
$content = trim((string)($item['content'] ?? ''));
$bodyText = $content !== '' ? $content : (string)($item['summary'] ?? '');
$meta = array_filter([
    $item['display_date'] ?? null,
    $item['author'] ?? null,
    isset($item['updated_at']) ? 'อัปเดตล่าสุด ' . thai_datetime($item['updated_at']) : null,
]);
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($title) ?> - โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</title>
    <link rel="stylesheet" href="style.css">
</head>
<body data-page="news-detail">
    <div class="top-strip">
        <div class="container">
            <span>โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</span>
            <span>"เรียนดี มีความสุข"</span>
        </div>
    </div>

    <header class="header">
        <div class="container brand">
            <img class="brand-logo" src="img/Colour.png" alt="ตราสัญลักษณ์โรงเรียน">
            <div>
                <h1>โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</h1>
            </div>
        </div>
    </header>

    <div class="nav-wrap">
        <nav class="container nav" aria-label="เมนูหลัก">
            <a href="index.html">หน้าหลัก HOME</a>
            <div class="dropdown">
                <button type="button">เกี่ยวกับ ABOUT US</button>
                <div class="dropdown-menu">
                    <a href="history.html">ประวัติความเป็นมา</a>
                    <a href="authority.html">อำนาจ หน้าที่</a>
                    <a href="mission.html">วิสัยทัศน์ พันธกิจ จุดเน้น</a>
                    <a href="teachers.html">ผู้บริหารและบุคลากร</a>
                    <a href="laws.html">กฎหมายที่เกี่ยวข้อง</a>
                </div>
            </div>
            <div class="dropdown">
                <button type="button">ข่าวสารกิจกรรม NEWS</button>
                <div class="dropdown-menu">
                    <a href="news.html">ข่าวประชาสัมพันธ์</a>
                    <a href="jobs.html">ข่าวรับสมัครงาน</a>
                    <a href="procurement.html">จัดซื้อจัดจ้าง</a>
                </div>
            </div>
            <a href="acievement.html">การดำเนินงาน ACHIEVEMENT</a>
            <a href="contact.html">ติดต่อเรา CONTACT US</a>
        </nav>
    </div>

    <section class="page-hero news-hero">
        <div class="container">
            <div class="breadcrumb">หน้าหลัก / ข่าวสารกิจกรรม / <?= h(type_label($type)) ?></div>
            <h2><?= h(type_label($type)) ?></h2>
            <p>อ่านรายละเอียดประกาศและข่าวสารจากโรงเรียน</p>
        </div>
    </section>

    <main class="news-page">
        <div class="container detail-layout">
            <?php if (!$item): ?>
                <article class="news-detail">
                    <span class="news-pill">ไม่พบข้อมูล</span>
                    <h2>ไม่พบข่าวที่ต้องการอ่าน</h2>
                    <p>ข่าวนี้อาจถูกลบหรือยังไม่ได้เผยแพร่</p>
                    <a class="read-more" href="news.html">กลับหน้าข่าว</a>
                </article>
            <?php else: ?>
                <article class="news-detail">
                    <?php if (!empty($item['image_url'])): ?>
                        <img class="news-detail-image" src="<?= h($item['image_url']) ?>" alt="<?= h($item['title']) ?>">
                    <?php endif; ?>
                    <span class="news-pill <?= h($item['news_type'] === 'job' ? 'green' : ($item['category'] === 'กิจกรรม' ? 'purple' : '')) ?>">
                        <?= h($item['category'] ?: type_label($type)) ?>
                    </span>
                    <h2><?= h($item['title']) ?></h2>
                    <div class="news-meta"><?= h(implode(' | ', $meta)) ?></div>

                    <?php if (!empty($item['announcement_no']) || !empty($item['display_status']) || !empty($item['meta_one']) || !empty($item['meta_two'])): ?>
                        <div class="detail-meta-box">
                            <?php if (!empty($item['announcement_no'])): ?><span>เลขที่ประกาศ: <?= h($item['announcement_no']) ?></span><?php endif; ?>
                            <?php if (!empty($item['display_status'])): ?><span>สถานะ: <?= h($item['display_status']) ?></span><?php endif; ?>
                            <?php if (!empty($item['meta_one'])): ?><span><?= h($item['meta_one']) ?></span><?php endif; ?>
                            <?php if (!empty($item['meta_two'])): ?><span><?= h($item['meta_two']) ?></span><?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <p class="detail-summary"><?= h($item['summary']) ?></p>
                    <div class="detail-content">
                        <?= nl2br(h($bodyText)) ?>
                    </div>

                    <a class="read-more" href="<?= h(back_url($type)) ?>">กลับไปยัง<?= h(type_label($type)) ?></a>
                </article>
            <?php endif; ?>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-top">
                <div>
                    <img src="img/Colour.png" alt="ตราสัญลักษณ์">
                    <h3>โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</h3>
                </div>
                <div class="qr">
                    <h3>สอบถามข้อมูลเพิ่มเติม</h3>
                    <img src="https://www.mueangnakhonsidole.com/images/sampledata/qr-code.webp" alt="qr code">
                </div>
            </div>
        </div>
    </footer>
</body>
</html>
