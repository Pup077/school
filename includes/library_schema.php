<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function ensure_library_schema(): void
{
    db()->exec('CREATE TABLE IF NOT EXISTS library_documents (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        category ENUM("curriculum", "student_form") NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NULL,
        pdf_url VARCHAR(500) NOT NULL,
        original_name VARCHAR(255) NULL,
        author VARCHAR(150) NULL,
        view_count INT UNSIGNED NOT NULL DEFAULT 0,
        status ENUM("draft", "published") NOT NULL DEFAULT "published",
        created_by INT UNSIGNED NULL,
        updated_by INT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_library_category_status (category, status),
        CONSTRAINT fk_library_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        CONSTRAINT fk_library_updated_by FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
}
