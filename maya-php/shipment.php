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

$isAdmin  = $me['role'] === 'admin';
$isStaff  = $me['role'] === 'admin' || $me['role'] === 'staff';
$isCustomer = $me['role'] === 'customer';

if (!$isStaff && (int)$s['customer_id'] !== (int)$me['id']) {
    http_response_code(403); die('You do not have access to this shipment.');
}

$canEdit    = $isAdmin || ($isStaff && (int)$me['can_manage_shipments'] === 1);
$canMarkPaid = $isAdmin;

// Invoice visible to admin/staff-with-perm always; customers only when paid=1
$canInvoice = $isAdmin
    || ((int)$me['can_generate_invoice'] === 1)
    || ($isCustomer && (int)$s['paid'] === 1);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'update_status' && $canEdit) {
        $st = $_POST['status'] ?? '';
        if (in_array($st, ['pending','in_transit','delivered'], true)) {
            $delivered = $st === 'delivered' ? date('Y-m-d H:i:s') : null;
            $pdo->prepare('UPDATE shipments SET status = ?, delivered_at = ? WHERE id = ?')
                ->execute([$st, $delivered, $id]);
            flash_set('success', 'Status updated.');
        }
        header('Location: shipment.php?id=' . $id); exit;
    }

    if ($action === 'update_cost' && $canEdit) {
        $cost = (float)($_POST['cost_npr'] ?? 0);
        $pdo->prepare('UPDATE shipments SET cost_npr = ? WHERE id = ?')->execute([$cost, $id]);
        flash_set('success', 'Cost updated.');
        header('Location: shipment.php?id=' . $id); exit;
    }

    if ($action === 'toggle_paid' && $canMarkPaid) {
        $newPaid = (int)$s['paid'] === 0 ? 1 : 0;
        $paidAt  = $newPaid ? date('Y-m-d H:i:s') : null;
        $pdo->prepare('UPDATE shipments SET paid = ?, paid_at = ? WHERE id = ?')
            ->execute([$newPaid, $paidAt, $id]);
        flash_set('success', $newPaid ? 'Payment confirmed. Customer can now access invoice.' : 'Payment mark removed.');
        header('Location: shipment.php?id=' . $id); exit;
    }

    if ($action === 'delete' && $canEdit) {
        $pdo->prepare('DELETE FROM shipments WHERE id = ?')->execute([$id]);
        flash_set('success', 'Shipment deleted.');
        header('Location: shipments.php'); exit;
    }
}

// Re-fetch after any POST
$stmt->execute([$id]);
$s = $stmt->fetch() ?: $s;

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
      <h1>
        <?= e($s['tracking_id']) ?>
        <span class="badge <?= e(status_class($s['status'])) ?>" style="font-size:.7rem;vertical-align:middle;"><?= e(status_label($s['status'])) ?></span>
        <?php if ($s['paid']): ?>
          <span class="badge badge-ok" style="font-size:.7rem;vertical-align:middle;">Payment Received</span>
        <?php else: ?>
          <span class="badge badge-warn" style="font-size:.7rem;vertical-align:middle;">Payment Pending</span>
        <?php endif; ?>
      </h1>
      <p class="muted"><?= e($s['origin']) ?> → <?= e($s['destination']) ?> · <?= strtoupper(e($s['mode'])) ?> · <?= e($s['weight_kg']) ?> kg</p>
    </div>
    <div class="row-flex">
      <?php if ($canInvoice): ?>
        <a class="btn-navy" href="<?= e($invoiceUrl) ?>" target="_blank">View Invoice</a>
      <?php endif; ?>
      <a class="btn-outline" href="shipments.php">← All shipments</a>
    </div>
  </div>

  <?php if ($isCustomer && !$s['paid']): ?>
    <div class="flash flash-warn">
      <strong>Invoice not available yet.</strong>
      Your invoice will appear here once the admin confirms your payment. Please contact us via WhatsApp or email if you need help.
    </div>
  <?php elseif ($isCustomer && $s['paid']): ?>
    <div class="flash flash-success">
      <strong>Payment confirmed.</strong>
      Your payment has been received<?= $s['paid_at'] ? ' on ' . e(format_date($s['paid_at'])) : '' ?>.
      Click <strong>View Invoice</strong> above to open your invoice.
    </div>
  <?php endif; ?>

  <div class="card">
    <h3>Shipment details</h3>
    <div class="detail-grid">
      <div class="row"><div class="label">Customer</div><div class="value"><?= e($customer['name']) ?></div></div>
      <div class="row"><div class="label">Customer email</div><div class="value"><?= e($customer['email']) ?></div></div>
      <div class="row"><div class="label">Sender</div><div class="value"><?= e($s['sender_name']) ?><?= $s['sender_phone'] ? ' · ' . e($s['sender_phone']) : '' ?></div></div>
      <div class="row"><div class="label">Receiver</div><div class="value"><?= e($s['receiver_name']) ?><?= $s['receiver_phone'] ? ' · ' . e($s['receiver_phone']) : '' ?></div></div>
      <div class="row"><div class="label">From</div><div class="value"><?= e($s['sender_address']) ?></div></div>
      <div class="row"><div class="label">To</div><div class="value"><?= e($s['receiver_address']) ?></div></div>
      <div class="row"><div class="label">Cost</div><div class="value"><?= e(format_npr($s['cost_npr'])) ?></div></div>
      <div class="row"><div class="label">Payment</div><div class="value">
        <?= $s['paid'] ? '✅ Received' . ($s['paid_at'] ? ' – ' . e(format_date($s['paid_at'])) : '') : '⏳ Pending' ?>
      </div></div>
      <div class="row"><div class="label">Created</div><div class="value"><?= e(format_datetime($s['created_at'])) ?></div></div>
      <?php if ($s['delivered_at']): ?>
        <div class="row"><div class="label">Delivered</div><div class="value"><?= e(format_datetime($s['delivered_at'])) ?></div></div>
      <?php endif; ?>
    </div>
    <?php if ($s['description']): ?><div class="mt-2"><strong>Description:</strong><br><?= nl2br(e($s['description'])) ?></div><?php endif; ?>
    <?php if ($isStaff && $s['notes']): ?><div class="mt-2"><strong>Internal notes:</strong><br><?= nl2br(e($s['notes'])) ?></div><?php endif; ?>
  </div>

  <?php if ($canEdit || $canMarkPaid): ?>
  <div class="card">
    <h3>Admin controls</h3>

    <?php if ($canMarkPaid): ?>
    <div class="mt-1">
      <p class="muted" style="margin-bottom:.5rem;font-size:.85rem;">Payment status</p>
      <form method="post" style="display:inline;">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="toggle_paid">
        <?php if ($s['paid']): ?>
          <button class="btn-outline" type="submit" onclick="return confirm('Remove payment confirmation?')">✗ Mark as Unpaid</button>
          <span class="muted" style="margin-left:.75rem;">Paid on <?= e(format_date($s['paid_at'])) ?></span>
        <?php else: ?>
          <button class="btn btn-navy" type="submit">✓ Confirm Payment Received</button>
        <?php endif; ?>
      </form>
    </div>
    <?php endif; ?>

    <?php if ($canEdit): ?>
    <h3 class="mt-3">Update status</h3>
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
    <?php endif; ?>
  </div>
  <?php endif; ?>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
