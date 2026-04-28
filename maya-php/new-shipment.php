<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_login();
$isStaff = $me['role'] === 'admin' || $me['role'] === 'staff';

if ($isStaff && !$me['can_manage_shipments'] && $me['role'] !== 'admin') {
    die('You do not have permission to create shipments.');
}

$customers = [];
if ($isStaff) {
    $customers = $pdo->query("SELECT id, name, email FROM users WHERE role='customer' ORDER BY name")->fetchAll();
}

$errors = [];
$f = [
    'customer_id'      => $isStaff ? '' : (string)$me['id'],
    'sender_name'      => $me['name'],
    'sender_phone'     => $me['phone'] ?? '',
    'sender_address'   => '',
    'receiver_name'    => '',
    'receiver_phone'   => '',
    'receiver_address' => '',
    'origin'           => 'Kathmandu',
    'destination'      => '',
    'mode'             => 'air',
    'weight_kg'        => '1',
    'description'      => '',
    'cost_npr'         => '0',
    'notes'            => '',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    foreach ($f as $k => $_) $f[$k] = trim($_POST[$k] ?? '');
    if (!$isStaff) $f['customer_id'] = (string)$me['id'];

    foreach (['sender_name','sender_phone','sender_address','receiver_name','receiver_phone','receiver_address',
              'origin','destination','mode','weight_kg'] as $req) {
        if ($f[$req] === '') $errors[] = ucwords(str_replace('_', ' ', $req)) . ' is required.';
    }
    if (!in_array($f['mode'], ['air','sea','road'], true)) $errors[] = 'Invalid mode.';
    if (!is_numeric($f['weight_kg']) || (float)$f['weight_kg'] <= 0) $errors[] = 'Weight must be a positive number.';
    if (!is_numeric($f['cost_npr']) || (float)$f['cost_npr'] < 0) $errors[] = 'Cost must be a non-negative number.';
    if ($isStaff && (!$f['customer_id'] || !ctype_digit($f['customer_id']))) $errors[] = 'Please pick a customer.';

    if (!$errors) {
        $tracking = generate_tracking_id($pdo);
        $stmt = $pdo->prepare(
            'INSERT INTO shipments (tracking_id, customer_id, created_by_id,
              sender_name, sender_phone, sender_address,
              receiver_name, receiver_phone, receiver_address,
              origin, destination, mode, weight_kg, description, cost_npr, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $tracking, (int)$f['customer_id'], $me['id'],
            $f['sender_name'], $f['sender_phone'], $f['sender_address'],
            $f['receiver_name'], $f['receiver_phone'], $f['receiver_address'],
            $f['origin'], $f['destination'], $f['mode'],
            (float)$f['weight_kg'], $f['description'], (float)$f['cost_npr'], $f['notes'],
        ]);
        flash_set('success', "Shipment $tracking created.");
        header('Location: shipment.php?id=' . $pdo->lastInsertId());
        exit;
    }
}

$pageTitle = 'New Shipment';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <h1>New Shipment</h1>
  <?php foreach ($errors as $err): ?><div class="flash flash-error"><?= e($err) ?></div><?php endforeach; ?>

  <form method="post">
    <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">

    <?php if ($isStaff): ?>
      <div class="card">
        <h3>Customer</h3>
        <div class="form-row">
          <label>Book for customer</label>
          <select name="customer_id" required>
            <option value="">— select customer —</option>
            <?php foreach ($customers as $c): ?>
              <option value="<?= (int)$c['id'] ?>" <?= $f['customer_id']==$c['id']?'selected':'' ?>>
                <?= e($c['name']) ?> (<?= e($c['email']) ?>)
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
    <?php endif; ?>

    <div class="card">
      <h3>Sender</h3>
      <div class="form-grid">
        <div class="form-row"><label>Name</label><input name="sender_name" value="<?= e($f['sender_name']) ?>" required></div>
        <div class="form-row"><label>Phone</label><input name="sender_phone" value="<?= e($f['sender_phone']) ?>" required></div>
      </div>
      <div class="form-row"><label>Address</label><input name="sender_address" value="<?= e($f['sender_address']) ?>" required></div>
    </div>

    <div class="card">
      <h3>Receiver</h3>
      <div class="form-grid">
        <div class="form-row"><label>Name</label><input name="receiver_name" value="<?= e($f['receiver_name']) ?>" required></div>
        <div class="form-row"><label>Phone</label><input name="receiver_phone" value="<?= e($f['receiver_phone']) ?>" required></div>
      </div>
      <div class="form-row"><label>Address</label><input name="receiver_address" value="<?= e($f['receiver_address']) ?>" required></div>
    </div>

    <div class="card">
      <h3>Cargo</h3>
      <div class="form-grid">
        <div class="form-row"><label>Origin</label><input name="origin" value="<?= e($f['origin']) ?>" required></div>
        <div class="form-row"><label>Destination</label><input name="destination" value="<?= e($f['destination']) ?>" required></div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Mode</label>
          <select name="mode">
            <option value="air"  <?= $f['mode']==='air'?'selected':'' ?>>Air</option>
            <option value="sea"  <?= $f['mode']==='sea'?'selected':'' ?>>Sea</option>
            <option value="road" <?= $f['mode']==='road'?'selected':'' ?>>Road</option>
          </select>
        </div>
        <div class="form-row"><label>Weight (kg)</label><input name="weight_kg" type="number" step="0.01" min="0" value="<?= e($f['weight_kg']) ?>" required></div>
      </div>
      <div class="form-row"><label>Description</label><textarea name="description"><?= e($f['description']) ?></textarea></div>
      <?php if ($isStaff): ?>
      <div class="form-row"><label>Cost (Rs.)</label><input name="cost_npr" type="number" step="0.01" min="0" value="<?= e($f['cost_npr']) ?>"></div>
      <div class="form-row"><label>Internal notes</label><textarea name="notes"><?= e($f['notes']) ?></textarea></div>
      <?php else: ?>
      <input type="hidden" name="cost_npr" value="0">
      <input type="hidden" name="notes" value="">
      <?php endif; ?>
    </div>

    <div class="row-flex">
      <button class="btn" type="submit">Create Shipment</button>
      <a class="btn-outline" href="shipments.php">Cancel</a>
    </div>
  </form>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
