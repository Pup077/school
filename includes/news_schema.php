<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function db_column_exists(string $table, string $column): bool
{
    $stmt = db()->prepare(
        'SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);

    return (int)$stmt->fetchColumn() > 0;
}

function ensure_news_document_schema(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    if (!db_column_exists('news_items', 'document_name')) {
        db()->exec('ALTER TABLE news_items ADD COLUMN document_name VARCHAR(255) NULL AFTER document_url');
    }

    db()->exec(
        'CREATE TABLE IF NOT EXISTS news_documents (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            news_item_id INT UNSIGNED NOT NULL,
            document_url VARCHAR(500) NOT NULL,
            document_name VARCHAR(255) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_news_document_item
                FOREIGN KEY (news_item_id) REFERENCES news_items(id)
                ON UPDATE CASCADE ON DELETE CASCADE,
            INDEX idx_news_document_item (news_item_id, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $ensured = true;
}
