<?php
// Maya Import Export Logistic — Database & app configuration

// ----- Database -----
$DB_HOST = 'localhost';
$DB_NAME = 'maya_logistics';
$DB_USER = 'root';
$DB_PASS = '';

// ----- Brand / contact -----
define('SITE_NAME', 'Maya Import Export Logistic');
define('SITE_TAGLINE', 'From Nepal to the World');
define('CONTACT_PHONE', '9769686908');
define('CONTACT_PHONE_INTL', '9779769686908');
define('CONTACT_EMAIL', 'mayaimportexportinternational@gmail.com');
define('CONTACT_ADDRESS', 'Anandamaya Marg, Dhumbarahi, Kathmandu, Nepal');
define('GOOGLE_MAPS_QUERY', 'Anandamaya+Marg,+Dhumbarahi,+Kathmandu,+Nepal');

// ----- OTP recovery (demo) -----
define('OTP_RECOVERY_EMAIL', 'greenhouse2053@gmail.com');
define('OTP_RECOVERY_PHONE', '9845965460');
define('OTP_DEMO_MODE', true); // when true, OTP is shown on screen instead of sent

// ----- Bootstrap PDO -----
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    die('Database connection failed: ' . htmlspecialchars($e->getMessage()));
}
