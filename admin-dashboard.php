<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

require_admin();

readfile(__DIR__ . '/admin-dashboard.html');

