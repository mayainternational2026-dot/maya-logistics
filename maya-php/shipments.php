<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_login();

$isStaff = $me['role'] === 'admin' || $me['role'] === 'staff';
$status  = $_GET['status'] ?? '';
$search  = trim($_GET['q'] ?? '');

$where = [];
$params = [];
if (!$isStaff) { $where[] = 's.customer_id = ?'; $params[] = $me['id']; }
if (in_array($status, ['pending','in_transit','delivered'], true)) {
    $where[] = 's.status = ?'; $params[] = $status;
}
if ($search !== '') {
    $where[] = '(s.tracking_id LIKE ? OR s.origin LIKE ? OR s.destination LIKE ? OR u.name LIKE ?)';
    $like = "%$search%";
    array_push($params, $like, $like, $like, $like);
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $pdo->prepare(
    "SELECT s.*, u.name AS customer_name FROM shipments s JOIN users u ON u.id = s.customer_id
     $whereSql ORDER BY s.created_at DESC"
);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$pageTitle = 'Shipments';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <div class="page-head">
    <h1>Shipments</h1>
    <a href="new-shipment.php" class="btn">+ New Shipment</a>
  </div>

  <form method="get" class="toolbar">
    <input name="q" value="<?= e($search) ?>" placeholder="Search tracking ID, route, customer...">
    <select name="status">
      <option value="">All statuses</option>
      <option value="pending"    <?= $status==='pending'?'selected':'' ?>>Pending</option>
      <option value="in_transit" <?= $status==='in_transit'?'selected':'' ?>>In Transit</option>
      <option value="delivered"  <?= $status==='delivered'?'selected':'' ?>>Delivered</option>
    </select>
    <button class="btn-outline" type="submit">Apply</button>
    <?php if ($status || $search): ?><a class="btn-outline" href="shipments.php">Clear</a><?php endif; ?>
  </form>

  <div class="table-wrap"><table class="data">
    <thead><tr>
      <th>Tracking ID</th><?php if ($isStaff): ?><th>Customer</th><?php endif; ?>
      <th>Route</th><th>Mode</th><th>Status</th><th>Cost</th><th>Created</th><th></th>
    </tr></thead>
    <tbody>
    <?php foreach ($rows as $s): ?>
      <tr>
        <td><strong><?= e($s['tracking_id']) ?></strong></td>
        <?php if ($isStaff): ?><td><?= e($s['customer_name']) ?></td><?php endif; ?>
        <td><?= e($s['origin']) ?> → <?= e($s['destination']) ?></td>
        <td><?= strtoupper(e($s['mode'])) ?></td>
        <td><span class="badge <?= e(status_class($s['status'])) ?>"><?= e(status_label($s['status'])) ?></span></td>
        <td><?= e(format_npr($s['cost_npr'])) ?></td>
        <td><?= e(format_date($s['created_at'])) ?></td>
        <td><a href="shipment.php?id=<?= (int)$s['id'] ?>">View →</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$rows): ?>
      <tr><td colspan="<?= $isStaff?8:7 ?>" style="text-align:center;color:var(--muted);padding:2rem;">
        No shipments match your filters. <a href="new-shipment.php">Create one →</a>
      </td></tr>
    <?php endif; ?>
    </tbody>
  </table></div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
