<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_roles(['admin']);

$rows = $pdo->query(
    "SELECT u.id, u.name, u.email, u.role,
            COUNT(s.id) AS total,
            SUM(CASE WHEN s.status='delivered' THEN 1 ELSE 0 END) AS delivered,
            COALESCE(SUM(s.cost_npr), 0) AS revenue
     FROM users u
     LEFT JOIN shipments s ON s.created_by_id = u.id
     WHERE u.role IN ('admin','staff')
     GROUP BY u.id, u.name, u.email, u.role
     ORDER BY total DESC, u.name"
)->fetchAll();

$pageTitle = 'Staff Activity';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <h1>Staff activity</h1>
  <p class="muted">Shipments created by each staff/admin user</p>
  <div class="table-wrap"><table class="data">
    <thead><tr><th>Staff member</th><th>Email</th><th>Role</th><th>Shipments created</th><th>Delivered</th><th>Revenue</th></tr></thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td><strong><?= e($r['name']) ?></strong></td>
        <td><?= e($r['email']) ?></td>
        <td><span class="badge <?= $r['role']==='admin'?'badge-warn':'badge-info' ?>"><?= e(ucfirst($r['role'])) ?></span></td>
        <td><?= (int)$r['total'] ?></td>
        <td><?= (int)$r['delivered'] ?></td>
        <td><?= e(format_npr($r['revenue'])) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table></div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
