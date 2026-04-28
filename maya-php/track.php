<?php
require_once __DIR__ . '/includes/functions.php';

$id = trim($_GET['id'] ?? '');
$shipment = null;
$customer = null;
$searched = $id !== '';

if ($searched) {
    $stmt = $pdo->prepare(
        'SELECT s.*, u.name AS customer_name FROM shipments s JOIN users u ON u.id = s.customer_id
         WHERE s.tracking_id = ?'
    );
    $stmt->execute([strtoupper($id)]);
    $shipment = $stmt->fetch();
}

$pageTitle = 'Track Shipment';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <h1>Track your shipment</h1>
  <p class="muted">Enter your tracking ID (format: MIE followed by 8 characters)</p>

  <form method="get" class="row-flex mt-2" style="max-width:560px;">
    <input name="id" value="<?= e($id) ?>" placeholder="MIE12345678" style="flex:1;padding:.7rem .85rem;border:1px solid var(--line);border-radius:6px;">
    <button class="btn" type="submit">Track</button>
  </form>

  <?php if ($searched && !$shipment): ?>
    <div class="flash flash-error mt-2">No shipment found with tracking ID <strong><?= e($id) ?></strong>.</div>
  <?php endif; ?>

  <?php if ($shipment):
    $statuses = ['pending', 'in_transit', 'delivered'];
    $idx = array_search($shipment['status'], $statuses, true);
  ?>
    <div class="card mt-3">
      <div class="row-flex" style="justify-content:space-between;">
        <div>
          <h2><?= e($shipment['tracking_id']) ?></h2>
          <p class="muted"><?= e($shipment['origin']) ?> → <?= e($shipment['destination']) ?> · <?= strtoupper(e($shipment['mode'])) ?></p>
        </div>
        <span class="badge <?= e(status_class($shipment['status'])) ?>"><?= e(status_label($shipment['status'])) ?></span>
      </div>

      <div class="timeline">
        <?php foreach ($statuses as $i => $st):
          $cls = $i < $idx ? 'done' : ($i === $idx ? 'current done' : '');
        ?>
          <div class="step <?= $cls ?>">
            <div class="dot"><?= $i + 1 ?></div>
            <div class="label"><?= e(status_label($st)) ?></div>
          </div>
        <?php endforeach; ?>
      </div>

      <div class="detail-grid">
        <div class="row"><div class="label">Sender</div><div class="value"><?= e($shipment['sender_name']) ?></div></div>
        <div class="row"><div class="label">Receiver</div><div class="value"><?= e($shipment['receiver_name']) ?></div></div>
        <div class="row"><div class="label">From</div><div class="value"><?= e($shipment['sender_address']) ?></div></div>
        <div class="row"><div class="label">To</div><div class="value"><?= e($shipment['receiver_address']) ?></div></div>
        <div class="row"><div class="label">Weight</div><div class="value"><?= e($shipment['weight_kg']) ?> kg</div></div>
        <div class="row"><div class="label">Booked on</div><div class="value"><?= e(format_date($shipment['created_at'])) ?></div></div>
        <?php if ($shipment['delivered_at']): ?>
          <div class="row"><div class="label">Delivered on</div><div class="value"><?= e(format_datetime($shipment['delivered_at'])) ?></div></div>
        <?php endif; ?>
      </div>

      <?php if ($shipment['notes']): ?>
        <div class="mt-2"><strong>Notes:</strong> <?= e($shipment['notes']) ?></div>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
