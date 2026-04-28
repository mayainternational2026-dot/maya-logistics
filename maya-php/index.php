<?php
require_once __DIR__ . '/includes/functions.php';

// Handle contact form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'contact') {
    check_csrf();
    $stmt = $pdo->prepare(
        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($_POST['name'] ?? ''),
        trim($_POST['email'] ?? ''),
        trim($_POST['phone'] ?? ''),
        trim($_POST['subject'] ?? ''),
        trim($_POST['message'] ?? ''),
    ]);
    flash_set('success', 'Thank you! We have received your message and will get back shortly.');
    header('Location: index.php#contact');
    exit;
}

$pageTitle = SITE_TAGLINE;
include __DIR__ . '/includes/header.php';
?>

<section class="hero">
  <img class="logo" src="assets/images/maya-logo.jpeg" alt="Maya">
  <h1>From Nepal to the <span class="accent">World</span></h1>
  <p>Global freight forwarding by air, sea, and road. Dependable, fast, and secure logistics from Kathmandu.</p>
  <form class="track-box" method="get" action="track.php">
    <input type="text" name="id" placeholder="Enter your Tracking ID..." required>
    <button class="btn" type="submit">Track</button>
  </form>
</section>

<section class="section">
  <div class="container">
    <h2>Our Services</h2>
    <p class="sub">Tailored cargo solutions for every shipment</p>
    <div class="services-grid">
      <div class="service">
        <div class="icon">✈</div>
        <h3>Air Freight</h3>
        <p class="muted">Fast worldwide delivery for time-sensitive shipments via Tribhuvan International Airport and partner carriers.</p>
      </div>
      <div class="service">
        <div class="icon">🚢</div>
        <h3>Sea Freight</h3>
        <p class="muted">Cost-effective ocean freight solutions for bulk cargo to and from Nepal via Kolkata and Visakhapatnam ports.</p>
      </div>
      <div class="service">
        <div class="icon">🚛</div>
        <h3>Road Freight</h3>
        <p class="muted">Reliable cross-border trucking across India, Bangladesh, China and door-to-door delivery within Nepal.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" style="background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);" id="contact">
  <div class="container">
    <h2>Visit or Contact Us</h2>
    <p class="sub">We are based in the heart of Kathmandu</p>
    <div class="contact-grid">
      <div>
        <iframe class="map-frame"
          src="https://maps.google.com/maps?q=<?= e(GOOGLE_MAPS_QUERY) ?>&t=&z=15&ie=UTF8&iwloc=&output=embed"
          allowfullscreen loading="lazy"></iframe>
        <div class="card mt-2">
          <h3>Office</h3>
          <p><?= e(CONTACT_ADDRESS) ?></p>
          <p><strong>Phone:</strong> <?= e(CONTACT_PHONE) ?></p>
          <p><strong>Email:</strong> <?= e(CONTACT_EMAIL) ?></p>
        </div>
      </div>
      <div class="card">
        <h3>Send us a message</h3>
        <form method="post">
          <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="contact">
          <div class="form-grid">
            <div class="form-row"><label>Name</label><input name="name" required></div>
            <div class="form-row"><label>Email</label><input type="email" name="email" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label>Phone</label><input name="phone"></div>
            <div class="form-row"><label>Subject</label><input name="subject"></div>
          </div>
          <div class="form-row"><label>Message</label><textarea name="message" required></textarea></div>
          <button class="btn" type="submit">Send Message</button>
        </form>
      </div>
    </div>
  </div>
</section>

<?php include __DIR__ . '/includes/footer.php'; ?>
