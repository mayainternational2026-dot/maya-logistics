<?php
require_once __DIR__ . '/functions.php';
$me = current_user();
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle ?? SITE_NAME) ?> — <?= e(SITE_NAME) ?></title>
<link rel="icon" type="image/jpeg" href="assets/images/maya-logo.jpeg">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<header class="navbar">
  <div class="container nav-inner">
    <a class="brand" href="index.php">
      <img src="assets/images/maya-logo.jpeg" alt="Maya">
      <span><strong>MAYA</strong> <span class="brand-accent">LOGISTICS</span></span>
    </a>
    <nav class="nav-links">
      <a class="<?= active_link('index.php') ?>" href="index.php">Home</a>
      <a class="<?= active_link('track.php') ?>" href="track.php">Track Shipment</a>
      <?php if ($me): ?>
        <a class="<?= active_link('dashboard.php') ?>" href="dashboard.php">Dashboard</a>
        <a class="<?= active_link('shipments.php') ?>" href="shipments.php">Shipments</a>
        <?php if ($me['role'] === 'admin'): ?>
          <a class="<?= active_link('users.php') ?>" href="users.php">Users</a>
          <a class="<?= active_link('staff-activity.php') ?>" href="staff-activity.php">Staff Activity</a>
        <?php endif; ?>
        <a class="<?= active_link('profile.php') ?>" href="profile.php"><?= e($me['name']) ?></a>
        <a href="logout.php" class="btn-outline btn-sm">Log Out</a>
      <?php else: ?>
        <a href="login.php" class="login-link">Log In</a>
        <a class="btn btn-sm" href="register.php">Register</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
<main class="main">
<?php foreach (flash_get() as $f): ?>
  <div class="container"><div class="flash flash-<?= e($f['type']) ?>"><?= e($f['msg']) ?></div></div>
<?php endforeach; ?>
