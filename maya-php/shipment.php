<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_login();

$id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare(
    'SELECT s.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM shipments s JOIN users u ON u.id = s.customer_id WHERE s.id = ?'
);
$stmt->execute([$id]);
$s = $stmt->fetch();
if (!$s) { http_response_code(404); die('Shipment not found.'); }

$isStaff = $me['role'] === 'admin' || $me['role'] === 'staff';
if (!$isStaff && (int)$s['customer_id'] !== (int)$me['id']) {
    http_response_code(403); die('You do not have access to this shipment.');
}
$canEdit = $me['role'] === 'admin' || ($isStaff && (int)$me['can_manage_shipments'] === 1);
$canInvoice = $me['role'] === 'admin' || (int)$me['can_generate_invoice'] === 1 || (int)$s['customer_id'] === (int)$me['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $canEdit) {
    check_csrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'update_status') {
        $st = $_POST['status'] ?? '';
        if (in_array($st, ['pending','in_transit','delivered'], true)) {
            $delivered = $st === 'delivered' ? date('Y-m-d H:i:s') : null;
            $pdo->prepare('UPDATE shipments SET status = ?, delivered_at = ? WHERE id = ?')
                ->execute([$st, $delivered, $id]);
            flash_set('success', 'Status updated.');
        }
        header('Location: shipment.php?id=' . $id); exit;
    }
    if ($action === 'update_cost') {
        $cost = (float)($_POST['cost_npr'] ?? 0);
        $pdo->prepare('UPDATE shipments SET cost_npr = ? WHERE id = ?')->execute([$cost, $id]);
        flash_set('success', 'Cost updated.');
        header('Location: shipment.php?id=' . $id); exit;
    }
    if ($action === 'delete') {
        $pdo->prepare('DELETE FROM shipments WHERE id = ?')->execute([$id]);
        flash_set('success', 'Shipment deleted.');
        header('Location: shipments.php'); exit;
    }
}

$customer = [
    'name'  => $s['customer_name'],
    'email' => $s['customer_email'],
    'phone' => $s['customer_phone'],
];
$invoiceUrl = build_invoice_url($s, $customer);

$pageTitle = 'Shipment ' . $s['tracking_id'];
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <div class="page-head">
    <div>
      <h1><?= e($s['tracking_id']) ?> <span class="badge <?= e(status_class($s['status'])) ?>" style="font-size:.7rem;vertical-align:middle;"><?= e(status_label($s['status'])) ?></span></h1>
      <p class="muted"><?= e($s['origin']) ?> → <?= e($s['destination']) ?> · <?= strtoupper(e($s['mode'])) ?> · <?= e($s['weight_kg']) ?> kg</p>
    </div>
    <div class="row-flex">
      <?php if ($canInvoice): ?>
        <a class="btn-navy" href="<?= e($invoiceUrl) ?>" target="_blank">Generate Invoice</a>
      <?php endif; ?>
      <a class="btn-outline" href="shipments.php">← All shipments</a>
    </div>
  </div>

  <div class="card">
    <h3>Shipment details</h3>
    <div class="detail-grid">
      <div class="row"><div class="label">Customer</div><div class="value"><?= e($customer['name']) ?></div></div>
      <div class="row"><div class="label">Customer email</div><div class="value"><?= e($customer['email']) ?></div></div>
      <div class="row"><div class="label">Sender</div><div class="value"><?= e($s['sender_name']) ?> · <?= e($s['sender_phone']) ?></div></div>
      <div class="row"><div class="label">Receiver</div><div class="value"><?= e($s['receiver_name']) ?> · <?= e($s['receiver_phone']) ?></div></div>
      <div class="row"><div class="label">From</div><div class="value"><?= e($s['sender_address']) ?></div></div>
      <div class="row"><div class="label">To</div><div class="value"><?= e($s['receiver_address']) ?></div></div>
      <div class="row"><div class="label">Cost</div><div class="value"><?= e(format_npr($s['cost_npr'])) ?></div></div>
      <div class="row"><div class="label">Created</div><div class="value"><?= e(format_datetime($s['created_at'])) ?></div></div>
      <?php if ($s['delivered_at']): ?>
        <div class="row"><div class="label">Delivered</div><div class="value"><?= e(format_datetime($s['delivered_at'])) ?></div></div>
      <?php endif; ?>
    </div>
    <?php if ($s['description']): ?><div class="mt-2"><strong>Description:</strong><br><?= nl2br(e($s['description'])) ?></div><?php endif; ?>
    <?php if ($isStaff && $s['notes']): ?><div class="mt-2"><strong>Internal notes:</strong><br><?= nl2br(e($s['notes'])) ?></div><?php endif; ?>
  </div>

  <?php if ($canEdit): ?>
  <div class="card">
    <h3>Update status</h3>
    <form method="post" class="row-flex">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="update_status">
      <select name="status">
        <option value="pending"    <?= $s['status']==='pending'?'selected':'' ?>>Pending</option>
        <option value="in_transit" <?= $s['status']==='in_transit'?'selected':'' ?>>In Transit</option>
        <option value="delivered"  <?= $s['status']==='delivered'?'selected':'' ?>>Delivered</option>
      </select>
      <button class="btn-navy" type="submit">Save status</button>
    </form>

    <h3 class="mt-3">Update cost</h3>
    <form method="post" class="row-flex">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="update_cost">
      <input type="number" step="0.01" min="0" name="cost_npr" value="<?= e($s['cost_npr']) ?>" style="padding:.55rem .75rem;border:1px solid var(--line);border-radius:6px;">
      <button class="btn-navy" type="submit">Save cost</button>
    </form>

    <h3 class="mt-3" style="color:var(--crimson)">Danger zone</h3>
    <form method="post" onsubmit="return confirm('Delete this shipment? This cannot be undone.');">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="delete">
      <button class="btn btn-danger" type="submit">Delete shipment</button>
    </form>
  </div>
  <?php endif; ?>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
