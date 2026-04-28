<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_roles(['admin']);

$err = ''; $msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $name  = trim($_POST['name'] ?? '');
        $email = strtolower(trim($_POST['email'] ?? ''));
        $phone = trim($_POST['phone'] ?? '');
        $role  = $_POST['role'] ?? 'customer';
        $pass  = $_POST['password'] ?? '';
        if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6
            || !in_array($role, ['admin','staff','customer'], true)) {
            $err = 'Please fill all fields. Password must be 6+ characters.';
        } else {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $err = 'Email already exists.';
            } else {
                $hash = password_hash($pass, PASSWORD_BCRYPT);
                $pdo->prepare('INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)')
                    ->execute([$name, $email, $phone ?: null, $hash, $role]);
                $newId = (int)$pdo->lastInsertId();
                if ($role === 'staff') {
                    $pdo->prepare('INSERT INTO permissions (user_id, can_manage_shipments, can_manage_customers, can_generate_invoice) VALUES (?,?,?,?)')
                        ->execute([$newId, 1, 0, 1]);
                }
                $msg = "User $email created.";
            }
        }
    } elseif ($action === 'permissions') {
        $uid = (int)($_POST['user_id'] ?? 0);
        $cms = isset($_POST['can_manage_shipments']) ? 1 : 0;
        $cmc = isset($_POST['can_manage_customers']) ? 1 : 0;
        $cgi = isset($_POST['can_generate_invoice']) ? 1 : 0;
        $stmt = $pdo->prepare('SELECT 1 FROM permissions WHERE user_id = ?');
        $stmt->execute([$uid]);
        if ($stmt->fetch()) {
            $pdo->prepare('UPDATE permissions SET can_manage_shipments=?, can_manage_customers=?, can_generate_invoice=? WHERE user_id=?')
                ->execute([$cms, $cmc, $cgi, $uid]);
        } else {
            $pdo->prepare('INSERT INTO permissions (user_id, can_manage_shipments, can_manage_customers, can_generate_invoice) VALUES (?,?,?,?)')
                ->execute([$uid, $cms, $cmc, $cgi]);
        }
        $msg = 'Permissions updated.';
    } elseif ($action === 'reset_password') {
        $uid = (int)($_POST['user_id'] ?? 0);
        $new = $_POST['new_password'] ?? '';
        if (strlen($new) < 6) $err = 'Password must be 6+ characters.';
        else {
            $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_BCRYPT), $uid]);
            $msg = 'Password reset.';
        }
    } elseif ($action === 'delete') {
        $uid = (int)($_POST['user_id'] ?? 0);
        if ($uid === (int)$me['id']) { $err = 'You cannot delete yourself.'; }
        else { $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$uid]); $msg = 'User deleted.'; }
    }
}

$users = $pdo->query(
    "SELECT u.*, p.can_manage_shipments, p.can_manage_customers, p.can_generate_invoice
     FROM users u LEFT JOIN permissions p ON p.user_id = u.id ORDER BY u.role, u.name"
)->fetchAll();

$pageTitle = 'Users';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;">
  <div class="page-head"><h1>User management</h1></div>
  <?php if ($msg): ?><div class="flash flash-success"><?= e($msg) ?></div><?php endif; ?>
  <?php if ($err): ?><div class="flash flash-error"><?= e($err) ?></div><?php endif; ?>

  <div class="card">
    <h3>Add a new user</h3>
    <form method="post">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="create">
      <div class="form-grid">
        <div class="form-row"><label>Name</label><input name="name" required></div>
        <div class="form-row"><label>Email</label><input type="email" name="email" required></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label>Phone</label><input name="phone"></div>
        <div class="form-row"><label>Role</label>
          <select name="role">
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div class="form-row"><label>Initial password</label><input type="password" name="password" required></div>
      <button class="btn" type="submit">Create user</button>
    </form>
  </div>

  <div class="card">
    <h3>All users (<?= count($users) ?>)</h3>
    <div class="table-wrap"><table class="data">
      <thead><tr>
        <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Permissions (staff only)</th><th>Actions</th>
      </tr></thead>
      <tbody>
      <?php foreach ($users as $u): ?>
        <tr>
          <td><strong><?= e($u['name']) ?></strong></td>
          <td><?= e($u['email']) ?></td>
          <td><?= e($u['phone']) ?: '—' ?></td>
          <td><span class="badge <?= $u['role']==='admin'?'badge-warn':($u['role']==='staff'?'badge-info':'badge-ok') ?>"><?= e(ucfirst($u['role'])) ?></span></td>
          <td>
            <?php if ($u['role'] === 'staff'): ?>
              <form method="post" class="row-flex" style="gap:.5rem;align-items:center;">
                <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="action" value="permissions">
                <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                <label style="font-size:.8rem;"><input type="checkbox" name="can_manage_shipments" <?= $u['can_manage_shipments']?'checked':'' ?>> Shipments</label>
                <label style="font-size:.8rem;"><input type="checkbox" name="can_manage_customers" <?= $u['can_manage_customers']?'checked':'' ?>> Customers</label>
                <label style="font-size:.8rem;"><input type="checkbox" name="can_generate_invoice" <?= $u['can_generate_invoice']?'checked':'' ?>> Invoice</label>
                <button class="btn-outline btn-sm" type="submit">Save</button>
              </form>
            <?php else: ?>
              <span class="muted">—</span>
            <?php endif; ?>
          </td>
          <td>
            <details><summary class="muted" style="cursor:pointer;">Manage</summary>
              <form method="post" class="row-flex mt-1" onsubmit="return confirm('Reset this user\'s password?');">
                <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
                <input type="hidden" name="action" value="reset_password">
                <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                <input type="password" name="new_password" placeholder="New password" required style="padding:.4rem;border:1px solid var(--line);border-radius:4px;">
                <button class="btn-outline btn-sm" type="submit">Reset</button>
              </form>
              <?php if ((int)$u['id'] !== (int)$me['id']): ?>
                <form method="post" class="mt-1" onsubmit="return confirm('Delete this user permanently?');">
                  <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
                  <input type="hidden" name="action" value="delete">
                  <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                  <button class="btn btn-danger btn-sm" type="submit">Delete user</button>
                </form>
              <?php endif; ?>
            </details>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table></div>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
