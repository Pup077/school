CREATE DATABASE IF NOT EXISTS school_admin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE school_admin;

CREATE TABLE admin_users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'editor') NOT NULL DEFAULT 'admin',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_by INT UNSIGNED NULL,
    updated_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_created_by
        FOREIGN KEY (created_by) REFERENCES admin_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_admin_updated_by
        FOREIGN KEY (updated_by) REFERENCES admin_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_admin_role_status (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    news_type ENUM('public', 'job', 'procurement') NOT NULL DEFAULT 'public',
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(120) NULL,
    publish_date DATE NULL,
    display_date VARCHAR(80) NULL,
    author VARCHAR(150) NULL,
    image_url VARCHAR(500) NULL,
    announcement_no VARCHAR(80) NULL,
    display_status VARCHAR(80) NULL,
    meta_one VARCHAR(255) NULL,
    meta_two VARCHAR(255) NULL,
    content LONGTEXT NULL,
    document_url VARCHAR(500) NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    sort_order INT NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    updated_by INT UNSIGNED NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_created_by
        FOREIGN KEY (created_by) REFERENCES admin_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_news_updated_by
        FOREIGN KEY (updated_by) REFERENCES admin_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_news_type_status (news_type, status),
    INDEX idx_news_publish_date (publish_date),
    INDEX idx_news_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id VARCHAR(80) NULL,
    target_name VARCHAR(255) NULL,
    detail TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_admin_user
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_activity_admin_user (admin_user_id),
    INDEX idx_activity_target (target_type, target_id),
    INDEX idx_activity_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_users (username, password_hash, full_name, role)
VALUES
('admin', '$2y$10$iT2vo8B7DQY2xY3zZgqKAeh1cTkKy25k.IgghufMZXez0be1yZI4G', 'ผู้ดูแลระบบ', 'admin');

INSERT INTO news_items
(news_type, title, summary, category, publish_date, display_date, author, image_url, announcement_no, display_status, meta_one, meta_two, status, sort_order, created_by, updated_by, published_at)
VALUES
('public', 'ปฐมนิเทศนักศึกษาใหม่ ภาคเรียนที่ 1 ปีการศึกษา 2569',
 'โรงเรียนจัดกิจกรรมปฐมนิเทศเพื่อชี้แจงแนวทางการเรียน การวัดผล และบริการสนับสนุนนักศึกษา พร้อมเปิดระบบติดตามผลการเรียนออนไลน์',
 'ข่าวเด่น', '2026-05-12', '12 พฤษภาคม 2569', 'งานประชาสัมพันธ์',
 'https://www.mueangnakhonsidole.com/images/thumbnails/mod_minifrontpage/55_125.webp',
 NULL, 'เผยแพร่', NULL, NULL, 'published', 10, 1, 1, NOW()),
('public', 'อบรมทักษะดิจิทัลสำหรับนักศึกษาผู้ใหญ่',
 'เสริมความรู้การใช้แอปพลิเคชันเพื่อการเรียนรู้ การค้นคว้า และการประกอบอาชีพในชีวิตประจำวัน',
 'กิจกรรม', '2026-05-08', '8 พฤษภาคม 2569', 'กลุ่มงานการศึกษาต่อเนื่อง',
 'https://www.mueangnakhonsidole.com/images/thumbnails/mod_minifrontpage/54_125.webp',
 NULL, 'เผยแพร่', NULL, NULL, 'published', 20, 1, 1, NOW()),
('job', 'ครูอัตราจ้าง วิชาเทคโนโลยีดิจิทัล',
 'จำนวน 1 อัตรา ปฏิบัติงานด้านการจัดการเรียนการสอนและพัฒนาสื่อออนไลน์สำหรับนักศึกษาผู้ใหญ่',
 'เปิดรับสมัคร', '2026-05-10', '10-24 พฤษภาคม 2569', 'งานบุคคล',
 NULL, NULL, 'เปิดรับสมัคร', 'รับสมัคร: 10-24 พฤษภาคม 2569', 'คุณวุฒิ: ปริญญาตรีสาขาที่เกี่ยวข้อง',
 'published', 30, 1, 1, NOW()),
('job', 'วิทยากรหลักสูตรอาชีพระยะสั้น',
 'รับสมัครวิทยากรด้านอาหาร งานหัตถกรรม และการตลาดออนไลน์ เพื่อจัดอบรมให้ประชาชนในพื้นที่',
 'เปิดรับสมัคร', '2026-05-15', '15-30 พฤษภาคม 2569', 'งานส่งเสริมอาชีพ',
 NULL, NULL, 'เปิดรับสมัคร', 'รับสมัคร: 15-30 พฤษภาคม 2569', 'คุณสมบัติ: มีประสบการณ์สอนหรือประกอบอาชีพจริง',
 'published', 40, 1, 1, NOW()),
('procurement', 'จัดซื้อวัสดุการเรียนการสอนสำหรับภาคเรียนที่ 1/2569',
 'ประกาศราคากลางสำหรับการจัดซื้อวัสดุการเรียนการสอน',
 'ประกาศราคากลาง', '2026-05-14', '14 พ.ค. 2569', NULL,
 NULL, 'พญ. 03/2569', 'เผยแพร่', NULL, NULL, 'published', 50, 1, 1, NOW()),
('procurement', 'จ้างปรับปรุงระบบเครือข่ายอินเทอร์เน็ตห้องเรียนคอมพิวเตอร์',
 'ประกาศเชิญชวนยื่นข้อเสนอปรับปรุงระบบเครือข่ายอินเทอร์เน็ต',
 'ประกาศเชิญชวน', '2026-05-09', '9 พ.ค. 2569', NULL,
 NULL, 'พญ. 02/2569', 'รับข้อเสนอ', NULL, NULL, 'published', 60, 1, 1, NOW());

INSERT INTO admin_activity_logs
(admin_user_id, action, target_type, target_id, target_name, detail)
VALUES
(1, 'create_admin', 'admin_user', '1', 'admin', 'สร้างบัญชีผู้ดูแลระบบเริ่มต้น'),
(1, 'seed_news', 'news_item', NULL, 'ข่าวเริ่มต้น', 'นำเข้าข่าวประชาสัมพันธ์ งาน และจัดซื้อจัดจ้างเริ่มต้น');
