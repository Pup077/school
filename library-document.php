<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/library_schema.php';
ensure_library_schema();
function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT); $item=null;
if ($id) { $stmt=db()->prepare('SELECT * FROM library_documents WHERE id=:id AND status="published"'); $stmt->execute(['id'=>$id]); $item=$stmt->fetch(); }
if ($item) db()->prepare('UPDATE library_documents SET view_count=view_count+1 WHERE id=:id')->execute(['id'=>$id]);
$category=$item['category'] ?? ($_GET['category'] ?? 'curriculum');
$back=$category==='student_form'?'student-forms.html':'curriculum.html';
$categoryTitle=$category==='student_form'?'แบบฟอร์ม/เอกสารสำหรับนักศึกษา':'หลักสูตร/คู่มือ/แนวทางการดำเนินงาน';
?><!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title><?= h($item['title'] ?? 'เอกสาร') ?> - โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</title><link rel="icon" href="img/Colour.png"><link rel="stylesheet" href="style.css"></head>
<body><div class="top-strip"><div class="container"><span>โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</span><span>"เรียนดี มีความสุข"</span></div></div>
<header class="header"><div class="container brand"><img class="brand-logo" src="img/Colour.png" alt="ตราสัญลักษณ์โรงเรียน"><div><h1>โรงเรียนผู้ใหญ่เทศบาลนครนครศรีธรรมราช</h1></div></div></header>
<div class="nav-wrap">
    <nav class="container nav" aria-label="เมนูหลัก">
        <a href="index.html" data-i18n="navHome">หน้าหลัก HOME</a>
        <div class="dropdown">
            <button type="button" data-i18n="navAbout">เกี่ยวกับ ABOUT US</button>
            <div class="dropdown-menu">
                <a href="history.html" data-i18n="history">ประวัติความเป็นมา</a>
                <a href="authority.html" data-i18n="authority">อำนาจ หน้าที่</a>
                <a href="mission.html" data-i18n="missionVision">วิสัยทัศน์ พันธกิจ จุดเน้น</a>
                <a href="teachers.html" data-i18n="staff">ผู้บริหารและบุคลากร</a>
                <a href="laws.html" data-i18n="law">กฎหมายที่เกี่ยวข้อง</a>
            </div>
        </div>
        <div class="dropdown">
            <button type="button" data-i18n="navNews">ข่าวสารกิจกรรม NEWS</button>
            <div class="dropdown-menu">
                <a href="news.html" data-i18n="publicNews">ข่าวประชาสัมพันธ์</a>
                <a href="jobs.html" data-i18n="jobsNews">ข่าวรับสมัครงาน</a>
                <a href="procurement.html" data-i18n="procurement">จัดซื้อจัดจ้าง</a>
                <a href="downloads.html">เอกสารดาวน์โหลด</a>
            </div>
        </div>
        <div class="dropdown">
            <button type="button" data-i18n="navStudentServices">บริการนักศึกษา</button>
            <div class="dropdown-menu student-services-menu">
                <a href="curriculum.html" data-i18n="curriculumGuide">หลักสูตร/คู่มือ/แนวทางการดำเนินงาน</a>
                <a href="student-forms.html" data-i18n="studentForms">แบบฟอร์ม/เอกสารสำหรับนักศึกษา</a>
                <a href="final-exam-schedule.html" data-i18n="finalExamSchedule">ตารางการทดสอบปลายภาคเรียน</a>
                <a href="nnet-exam-schedule.html" data-i18n="nnetExamSchedule">ตารางการทดสอบระดับชาติ N-NET</a>
                <a href="registration-plan.html" data-i18n="registrationPlan">แผนการลงทะเบียนเรียน</a>
                <a href="academic-calendar.html" data-i18n="academicCalendar">ปฏิทินการศึกษา</a>
            </div>
        </div>
            <a href="contact.html" data-i18n="navContact">ติดต่อเรา CONTACT US</a>
            <a class="online-application-link" href="https://docs.google.com/forms/d/e/1FAIpQLSfG4m92vubaF668XcgV-6QTfQkTpGSdPcSX7e3EojAPjFdD8Q/viewform" target="_blank" rel="noopener" aria-label="สมัครเรียนออนไลน์ ภาคเรียนที่ 1 ปีการศึกษา 2569">
                <strong>สมัครเรียนออนไลน์ <span>NEW</span></strong>
                <small>ภาคเรียนที่ 1 ปีการศึกษา 2569</small>
            </a>
    </nav>
</div>
<main class="library-detail-page"><div class="container">
<?php if (!$item): ?><section class="library-detail-card"><h2>ไม่พบเอกสาร</h2><a class="library-button secondary" href="<?= h($back) ?>">กลับหน้ารายการ</a></section>
<?php else: ?><section class="library-detail-card"><div class="breadcrumb">หน้าหลัก / <?= h($categoryTitle) ?></div><h2><?= h($item['title']) ?></h2><?php if ($item['description']): ?><p><?= nl2br(h($item['description'])) ?></p><?php endif; ?><div class="library-detail-actions"><a class="library-button" href="library-download.php?id=<?= (int)$item['id'] ?>" target="_blank" rel="noopener">เปิด PDF แบบเต็มหน้า</a><a class="library-button" href="library-download.php?id=<?= (int)$item['id'] ?>&amp;download=1">ดาวน์โหลดไฟล์</a><a class="library-button secondary" href="<?= h($back) ?>">กลับหน้ารายการ</a></div><iframe class="pdf-preview" src="<?= h($item['pdf_url']) ?>#toolbar=1&navpanes=1" title="ตัวอย่างเอกสาร PDF"></iframe></section><?php endif; ?>
</div></main><script src="language.js"></script></body></html>
