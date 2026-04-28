<?php
require_once __DIR__ . '/includes/functions.php';

if (current_user()) { header('Location: dashboard.php'); exit; }

$errors = [];
$old = ['name' => '', 'email' => '', 'phone' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $old['name']  = trim($_POST['name'] ?? '');
    $old['email'] = strtolower(trim($_POST['email'] ?? ''));
    $old['phone'] = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if (strlen($old['name']) < 2) $errors[] = 'Please enter your name.';
    if (!filter_var($old['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid email address.';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
    if ($password !== $confirm) $errors[] = 'Passwords do not match.';

    if (!$errors) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$old['email']]);
        if ($stmt->fetch()) {
            $errors[] = 'An account with that email already exists.';
        } else {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare(
                'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, "customer")'
            );
            $stmt->execute([$old['name'], $old['email'], $old['phone'] ?: null, $hash]);
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$pdo->lastInsertId();
            flash_set('success', 'Welcome to Maya Logistics, ' . $old['name'] . '!');
            header('Location: dashboard.php');
            exit;
        }
    }
}

$pageTitle = 'Create account';
include __DIR__ . '/includes/header.php';
?>
<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo"><img src="assets/images/maya-logo.jpeg" alt="Maya"></div>
    <h1>Create your account</h1>
    <p class="sub">Book and track shipments worldwide</p>
    <?php foreach ($errors as $err): ?><div class="flash flash-error"><?= e($err) ?></div><?php endforeach; ?>
    <form method="post">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <div class="form-row"><label>Full name</label><input name="name" value="<?= e($old['name']) ?>" required></div>
      <div class="form-row"><label>Email address</label><input type="email" name="email" value="<?= e($old['email']) ?>" required></div>
      <div class="form-row"><label>Phone (optional)</label><input name="phone" value="<?= e($old['phone']) ?>"></div>
      <div class="form-row"><label>Password</label><input type="password" name="password" required></div>
      <div class="form-row"><label>Confirm password</label><input type="password" name="confirm" required></div>
      <button class="btn btn-navy" style="width:100%" type="submit">Create account</button>
    </form>
    <p class="auth-foot">Already have an account? <a href="login.php">Sign in</a></p>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
