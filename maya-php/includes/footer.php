</main>
<footer class="footer">
  <div class="container footer-grid">
    <div>
      <div class="brand">
        <img src="assets/images/maya-logo.jpeg" alt="Maya">
        <span><strong>MAYA</strong> <span class="brand-accent">LOGISTICS</span></span>
      </div>
      <p class="muted">Reliable global freight forwarding from Kathmandu, Nepal — by air, sea, and road.</p>
    </div>
    <div>
      <h4>Contact</h4>
      <p><?= e(CONTACT_ADDRESS) ?></p>
      <p>Phone: <?= e(CONTACT_PHONE) ?></p>
      <p>Email: <?= e(CONTACT_EMAIL) ?></p>
    </div>
    <div>
      <h4>Quick links</h4>
      <p><a href="index.php">Home</a></p>
      <p><a href="track.php">Track Shipment</a></p>
      <p><a href="login.php">Log In</a></p>
    </div>
  </div>
  <div class="container footer-base">© <?= date('Y') ?> <?= e(SITE_NAME) ?>. All rights reserved.</div>
</footer>

<a class="whatsapp-btn" target="_blank" rel="noopener"
   href="https://wa.me/<?= e(CONTACT_PHONE_INTL) ?>"
   aria-label="Chat on WhatsApp">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.52 3.48A11.95 11.95 0 0 0 12.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.31-1.65a11.9 11.9 0 0 0 5.73 1.46h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.18-3.45-8.41ZM12.05 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7.01c0 5.46-4.45 9.91-9.93 9.91Zm5.45-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.35Z"/>
  </svg>
</a>
</body>
</html>
