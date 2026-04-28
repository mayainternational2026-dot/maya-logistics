<?php
require_once __DIR__ . '/includes/functions.php';
$me = require_login();

$msg = '';
$err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'profile') {
        $name  = trim($_POST['name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        if ($name === '') { $err = 'Name is required.'; }
        else {
            $pdo->prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
                ->execute([$name, $phone ?: null, $me['id']]);
            $msg = 'Profile updated.';
            $me = current_user();
        }
    } elseif ($action === 'password') {
        $cur = $_POST['current_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        $cnf = $_POST['confirm_password'] ?? '';
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$me['id']]);
        $row = $stmt->fetch();
        if (!password_verify($cur, $row['password_hash'])) {
            $err = 'Current password is incorrect.';
        } elseif (strlen($new) < 6) {
            $err = 'New password must be at least 6 characters.';
        } elseif ($new !== $cnf) {
            $err = 'Passwords do not match.';
        } else {
            $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_BCRYPT), $me['id']]);
            $msg = 'Password updated.';
        }
    }
}

$pageTitle = 'Profile';
include __DIR__ . '/includes/header.php';
?>
<div class="container" style="padding-top:2rem;max-width:720px;">
  <h1>Your profile</h1>
  <?php if ($msg): ?><div class="flash flash-success"><?= e($msg) ?></div><?php endif; ?>
  <?php if ($err): ?><div class="flash flash-error"><?= e($err) ?></div><?php endif; ?>

  <div class="card">
    <h3>Account information</h3>
    <form method="post">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="profile">
      <div class="form-row"><label>Name</label><input name="name" value="<?= e($me['name']) ?>" required></div>
      <div class="form-row"><label>Email (cannot be changed)</label><input value="<?= e($me['email']) ?>" disabled></div>
      <div class="form-row"><label>Phone</label><input name="phone" value="<?= e($me['phone']) ?>"></div>
      <div class="form-row"><label>Role</label><input value="<?= e(ucfirst($me['role'])) ?>" disabled></div>
      <button class="btn" type="submit">Save changes</button>
    </form>
  </div>

  <div class="card">
    <h3>Change password</h3>
    <form method="post">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="password">
      <div class="form-row"><label>Current password</label><input type="password" name="current_password" required></div>
      <div class="form-row"><label>New password</label><input type="password" name="new_password" required></div>
      <div class="form-row"><label>Confirm new password</label><input type="password" name="confirm_password" required></div>
      <button class="btn" type="submit">Update password</button>
    </form>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
