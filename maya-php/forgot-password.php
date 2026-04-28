<?php
require_once __DIR__ . '/includes/functions.php';

$step    = $_POST['step'] ?? 'request';
$message = '';
$error   = '';
$demoOtp = null;
$prefillEmail = trim($_POST['email'] ?? '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();

    if ($step === 'request') {
        $email = strtolower(trim($_POST['email'] ?? ''));
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $expires = date('Y-m-d H:i:s', time() + 15 * 60);
            $pdo->prepare('UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0')->execute([$email]);
            $pdo->prepare('INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)')
                 ->execute([$email, $code, $expires]);
            if (OTP_DEMO_MODE) $demoOtp = $code;
            // In production: send via email/SMS here.
            $message = "We sent a 6-digit code to $email. It is valid for 15 minutes.";
            $step = 'verify';
            $prefillEmail = $email;
        } else {
            $error = 'No account found with that email.';
        }
    } elseif ($step === 'verify') {
        $email = strtolower(trim($_POST['email'] ?? ''));
        $otp   = trim($_POST['otp'] ?? '');
        $new   = $_POST['new_password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';
        if (strlen($new) < 6) {
            $error = 'New password must be at least 6 characters.';
            $prefillEmail = $email;
        } elseif ($new !== $confirm) {
            $error = 'Passwords do not match.';
            $prefillEmail = $email;
        } else {
            $stmt = $pdo->prepare(
                'SELECT * FROM password_resets WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > NOW()
                 ORDER BY id DESC LIMIT 1'
            );
            $stmt->execute([$email, $otp]);
            $rec = $stmt->fetch();
            if (!$rec) {
                $error = 'Invalid or expired OTP code.';
                $prefillEmail = $email;
            } else {
                $hash = password_hash($new, PASSWORD_BCRYPT);
                $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')->execute([$hash, $email]);
                $pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')->execute([$rec['id']]);
                flash_set('success', 'Password reset successful. You can now sign in.');
                header('Location: login.php');
                exit;
            }
        }
    }
}

$pageTitle = 'Forgot password';
include __DIR__ . '/includes/header.php';
?>
<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo"><img src="assets/images/maya-logo.jpeg" alt="Maya"></div>
    <h1>Reset password</h1>
    <p class="sub">Recover access to your Maya Logistics account</p>

    <?php if ($message): ?><div class="flash flash-info"><?= e($message) ?></div><?php endif; ?>
    <?php if ($error): ?><div class="flash flash-error"><?= e($error) ?></div><?php endif; ?>
    <?php if ($demoOtp !== null): ?>
      <div class="flash flash-warn">Demo OTP (shown because email/SMS is not configured): <strong><?= e($demoOtp) ?></strong></div>
    <?php endif; ?>

    <?php if ($step === 'request'): ?>
      <form method="post">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="step" value="request">
        <div class="form-row"><label>Email address</label><input type="email" name="email" required></div>
        <button class="btn btn-navy" style="width:100%" type="submit">Send OTP</button>
      </form>
    <?php else: ?>
      <form method="post">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="step" value="verify">
        <div class="form-row"><label>Email</label><input type="email" name="email" value="<?= e($prefillEmail) ?>" required></div>
        <div class="form-row"><label>6-digit OTP</label><input name="otp" maxlength="6" required></div>
        <div class="form-row"><label>New password</label><input type="password" name="new_password" required></div>
        <div class="form-row"><label>Confirm password</label><input type="password" name="confirm_password" required></div>
        <button class="btn btn-navy" style="width:100%" type="submit">Reset password</button>
      </form>
    <?php endif; ?>

    <p class="auth-foot muted" style="font-size:.85rem;">
      Need help? Contact <?= e(OTP_RECOVERY_EMAIL) ?> or call <?= e(OTP_RECOVERY_PHONE) ?>.
    </p>
    <p class="auth-foot"><a href="login.php">Back to sign in</a></p>
  </div>
</div>
<?php include __DIR__ . '/includes/footer.php'; ?>
