<?php
require_once __DIR__ . '/includes/functions.php';

if (current_user()) { header('Location: dashboard.php'); exit; }

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if ($u && password_verify($password, $u['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $u['id'];
        flash_set('success', 'Welcome back, ' . $u['name'] . '!');
        header('Location: dashboard.php');
        exit;
    }
    $error = 'Invalid email or password.';
}

$pageTitle = 'Sign in';
include __DIR__ . '/includes/header.php';
?>
<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo"><img src="assets/images/maya-logo.jpeg" alt="Maya"></div>
    <h1>Sign in to your account</h1>
    <p class="sub">Manage your global shipments</p>
    <?php if ($error): ?><div class="flash flash-error"><?= e($error) ?></div><?php endif; ?>
    <form method="post" autocomplete="on">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <div class="form-row"><label>Email address</label><input type="email" name="email" required autocomplete="email"></div>
      <div class="form-row"><label>Password</label><input type="password" name="password" required autocomplete="current-password"></div>
      <p><a href="forgot-password.php">Forgot your password?</a></p>
      <button class="btn btn-navy" style="width:100%" type="submit">Sign in</button>
    </form>
    <p class="auth-foot">Don't have an account? <a href="register.php">Register now</a></p>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
