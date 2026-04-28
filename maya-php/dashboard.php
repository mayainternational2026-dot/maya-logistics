<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_login();

$isStaff = $me['role'] === 'admin' || $me['role'] === 'staff';

if ($isStaff) {
    $totalShipments = (int)$pdo->query('SELECT COUNT(*) FROM shipments')->fetchColumn();
    $pending     = (int)$pdo->query("SELECT COUNT(*) FROM shipments WHERE status='pending'")->fetchColumn();
    $inTransit   = (int)$pdo->query("SELECT COUNT(*) FROM shipments WHERE status='in_transit'")->fetchColumn();
    $delivered   = (int)$pdo->query("SELECT COUNT(*) FROM shipments WHERE status='delivered'")->fetchColumn();
    $totalRevenue = (float)$pdo->query('SELECT COALESCE(SUM(cost_npr),0) FROM shipments')->fetchColumn();
    $customers   = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='customer'")->fetchColumn();
    $staff       = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='staff'")->fetchColumn();

    $monthly = $pdo->query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS cnt, SUM(cost_npr) AS revenue
         FROM shipments WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY ym ORDER BY ym"
    )->fetchAll();

    $recent = $pdo->query(
        "SELECT s.*, u.name AS customer_name FROM shipments s JOIN users u ON u.id = s.customer_id
         ORDER BY s.created_at DESC LIMIT 8"
    )->fetchAll();
} else {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM shipments WHERE customer_id = ?');
    $stmt->execute([$me['id']]);
    $myCount = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(cost_npr), 0) FROM shipments WHERE customer_id = ?");
    $stmt->execute([$me['id']]);
    $mySpent = (float)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM shipments WHERE customer_id = ? AND status <> 'delivered'");
    $stmt->execute([$me['id']]);
    $myActive = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT * FROM shipments WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5"
    );
    $stmt->execute([$me['id']]);
    $myRecent = $stmt->fetchAll();
}

$pageTitle = 'Dashboard';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <div class="page-head">
    <h1>Welcome, <?= e($me['name']) ?></h1>
    <a href="new-shipment.php" class="btn">+ New Shipment</a>
  </div>

  <?php if ($isStaff): ?>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Total shipments</div><div class="value"><?= $totalShipments ?></div></div>
      <div class="kpi"><div class="label">In transit</div><div class="value"><?= $inTransit ?></div></div>
      <div class="kpi"><div class="label">Delivered</div><div class="value"><?= $delivered ?></div></div>
      <div class="kpi"><div class="label">Total revenue</div><div class="value"><?= e(format_npr($totalRevenue)) ?></div></div>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Pending</div><div class="value"><?= $pending ?></div></div>
      <div class="kpi"><div class="label">Customers</div><div class="value"><?= $customers ?></div></div>
      <div class="kpi"><div class="label">Staff</div><div class="value"><?= $staff ?></div></div>
      <div class="kpi"><div class="label">This year (12 mo)</div><div class="value"><?= count($monthly) ?> mo</div></div>
    </div>

    <div class="card">
      <h3>Monthly revenue (last 12 months)</h3>
      <canvas id="revChart" height="80"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
      const labels = <?= json_encode(array_map(fn($r) => $r['ym'], $monthly)) ?>;
      const revenue = <?= json_encode(array_map(fn($r) => (float)$r['revenue'], $monthly)) ?>;
      const counts = <?= json_encode(array_map(fn($r) => (int)$r['cnt'], $monthly)) ?>;
      new Chart(document.getElementById('revChart'), {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Revenue (Rs.)', data: revenue, backgroundColor: '#dc2626' },
          { label: 'Shipments', data: counts, backgroundColor: '#0b1b3b', yAxisID: 'y1' }
        ]},
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, position: 'left' },
            y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
          }
        }
      });
    </script>

    <div class="card">
      <h3>Recent shipments</h3>
      <div class="table-wrap"><table class="data">
        <thead><tr>
          <th>Tracking ID</th><th>Customer</th><th>Route</th>
          <th>Status</th><th>Cost</th><th>Created</th><th></th>
        </tr></thead>
        <tbody>
        <?php foreach ($recent as $s): ?>
          <tr>
            <td><strong><?= e($s['tracking_id']) ?></strong></td>
            <td><?= e($s['customer_name']) ?></td>
            <td><?= e($s['origin']) ?> → <?= e($s['destination']) ?></td>
            <td><span class="badge <?= e(status_class($s['status'])) ?>"><?= e(status_label($s['status'])) ?></span></td>
            <td><?= e(format_npr($s['cost_npr'])) ?></td>
            <td><?= e(format_date($s['created_at'])) ?></td>
            <td><a href="shipment.php?id=<?= (int)$s['id'] ?>">View →</a></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$recent): ?>
          <tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem;">No shipments yet.</td></tr>
        <?php endif; ?>
        </tbody>
      </table></div>
    </div>

  <?php else: ?>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">My shipments</div><div class="value"><?= $myCount ?></div></div>
      <div class="kpi"><div class="label">Active</div><div class="value"><?= $myActive ?></div></div>
      <div class="kpi"><div class="label">Total spent</div><div class="value"><?= e(format_npr($mySpent)) ?></div></div>
      <div class="kpi"><div class="label">Account</div><div class="value" style="font-size:1rem;"><?= e($me['email']) ?></div></div>
    </div>

    <div class="card">
      <h3>My recent shipments</h3>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>Tracking ID</th><th>Route</th><th>Status</th><th>Cost</th><th>Created</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($myRecent as $s): ?>
          <tr>
            <td><strong><?= e($s['tracking_id']) ?></strong></td>
            <td><?= e($s['origin']) ?> → <?= e($s['destination']) ?></td>
            <td><span class="badge <?= e(status_class($s['status'])) ?>"><?= e(status_label($s['status'])) ?></span></td>
            <td><?= e(format_npr($s['cost_npr'])) ?></td>
            <td><?= e(format_date($s['created_at'])) ?></td>
            <td><a href="shipment.php?id=<?= (int)$s['id'] ?>">View →</a></td>
          </tr>
        <?php endforeach; ?>
        <?php if (!$myRecent): ?>
          <tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem;">
            You haven't booked any shipments yet. <a href="new-shipment.php">Create one →</a>
          </td></tr>
        <?php endif; ?>
        </tbody>
      </table></div>
    </div>
  <?php endif; ?>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
