<?php
// Helper functions for Maya Import Export Logistic

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config.php';

// ---------- Auth ----------
function current_user(): ?array {
    global $pdo;
    if (empty($_SESSION['user_id'])) return null;
    $stmt = $pdo->prepare(
        "SELECT u.*, p.can_manage_shipments, p.can_manage_customers, p.can_generate_invoice
         FROM users u LEFT JOIN permissions p ON p.user_id = u.id
         WHERE u.id = ?"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $u = $stmt->fetch();
    if (!$u) {
        session_destroy();
        return null;
    }
    if ($u['role'] === 'admin') {
        $u['can_manage_shipments'] = 1;
        $u['can_manage_customers'] = 1;
        $u['can_generate_invoice'] = 1;
    }
    return $u;
}

function require_login(): array {
    $u = current_user();
    if (!$u) {
        header('Location: login.php');
        exit;
    }
    return $u;
}

function require_roles(array $roles): array {
    $u = require_login();
    if (!in_array($u['role'], $roles, true)) {
        http_response_code(403);
        die('Forbidden — you do not have access to this page.');
    }
    return $u;
}

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}

function check_csrf(): void {
    if (($_POST['_csrf'] ?? '') !== ($_SESSION['csrf'] ?? '__none__')) {
        http_response_code(400);
        die('Invalid CSRF token.');
    }
}

// ---------- Flash messages ----------
function flash_set(string $type, string $msg): void { $_SESSION['flash'][] = ['type' => $type, 'msg' => $msg]; }
function flash_get(): array {
    $out = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $out;
}

// ---------- Formatting ----------
function e(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function format_npr($amount): string {
    return 'Rs. ' . number_format((float)$amount, 2);
}

function format_date(?string $iso): string {
    if (!$iso) return '—';
    return date('M j, Y', strtotime($iso));
}

function format_datetime(?string $iso): string {
    if (!$iso) return '—';
    return date('M j, Y g:i A', strtotime($iso));
}

function status_label(string $s): string {
    return ['pending' => 'Pending', 'in_transit' => 'In Transit', 'delivered' => 'Delivered'][$s] ?? $s;
}

function status_class(string $s): string {
    return ['pending' => 'badge-warn', 'in_transit' => 'badge-info', 'delivered' => 'badge-ok'][$s] ?? 'badge';
}

// ---------- Tracking ID ----------
function generate_tracking_id(PDO $pdo): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $id = 'MIE';
        for ($i = 0; $i < 8; $i++) $id .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        $stmt = $pdo->prepare('SELECT 1 FROM shipments WHERE tracking_id = ?');
        $stmt->execute([$id]);
    } while ($stmt->fetch());
    return $id;
}

// ---------- Invoice generator URL ----------
function build_invoice_url(array $s, array $customer): string {
    $params = [
        'from'           => SITE_NAME . "\n" . CONTACT_ADDRESS . "\nTel: " . CONTACT_PHONE,
        'to'             => $customer['name'] . "\n" . ($customer['phone'] ?? '') . "\n" . $s['receiver_address'],
        'logo'           => '',
        'number'         => $s['tracking_id'],
        'currency'       => 'NPR',
        'date'           => date('Y-m-d', strtotime($s['created_at'])),
        'payment_terms'  => 'Due on delivery',
        'items[0][name]' => 'Cargo: ' . $s['origin'] . ' → ' . $s['destination'] . ' (' . strtoupper($s['mode']) . ', ' . $s['weight_kg'] . ' kg)',
        'items[0][quantity]' => 1,
        'items[0][unit_cost]' => $s['cost_npr'],
        'notes'          => $s['notes'] ?? 'Thank you for choosing ' . SITE_NAME,
    ];
    return 'https://invoice-generator.com/?' . http_build_query($params);
}

// ---------- Misc ----------
function active_link(string $page): string {
    return basename($_SERVER['PHP_SELF']) === $page ? 'active' : '';
}
