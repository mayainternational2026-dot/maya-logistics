# Maya Import Export Logistic — PHP + MySQL Edition

A complete PHP + MySQL version of the Maya Import Export Logistic web app.
Plain PHP 8 — no Composer, no frameworks, no build step. Runs anywhere with
PHP 8.0+ and MySQL 5.7+ / MariaDB 10.3+.

## Features

- Public marketing home page with embedded Google Map (Anandamaya Marg, Dhumbarahi, Kathmandu)
- Public shipment tracking page with status timeline
- Three roles: **admin**, **staff** (with per-user permissions), **customer**
- bcrypt-hashed passwords + PHP sessions for authentication
- Multi-step OTP password reset (demo mode shows the OTP on screen)
- Shipments CRUD (list/filter/search/create/view/update status/delete)
- Customers can self-book shipments and only see their own
- Staff/admin dashboard with KPI cards + Chart.js monthly revenue chart
- Customer dashboard with personal stats
- Admin user management (create users, edit staff permissions, reset passwords, delete)
- Staff activity leaderboard (admin only)
- "Generate Invoice" deep link to invoice-generator.com prefilled in NPR
- Floating WhatsApp button on every page (`https://wa.me/9779769686908`)
- Brand: navy + crimson + white, with the company logo

## Default login

After importing the schema, sign in with:

- **Email:** `admin@maya.com`
- **Password:** `admin123`

No demo data is seeded — the app is empty until you create users and shipments.

## Setup (XAMPP / WAMP / MAMP / LAMP)

1. Copy the entire `maya-php/` folder into your web root, e.g.:
   - XAMPP (Windows): `C:\xampp\htdocs\maya-php`
   - WAMP: `C:\wamp64\www\maya-php`
   - MAMP (macOS): `/Applications/MAMP/htdocs/maya-php`
   - LAMP (Linux): `/var/www/html/maya-php`

2. Start Apache + MySQL.

3. Open phpMyAdmin (or any MySQL client) and import `database/schema.sql`.
   This will create the `maya_logistics` database, all tables, and the default
   admin account.

4. Open `config.php` and update the database credentials if needed:
   ```php
   $DB_HOST = 'localhost';
   $DB_NAME = 'maya_logistics';
   $DB_USER = 'root';
   $DB_PASS = '';   // set your MySQL password
   ```

5. Visit `http://localhost/maya-php/` in your browser.

6. Sign in with `admin@maya.com` / `admin123` and start adding users / shipments.

## Setup (cPanel / shared hosting)

1. Upload the contents of the `maya-php/` folder via FTP or File Manager
   (typically into `public_html/` or a subfolder).
2. In cPanel → MySQL Databases, create a new database and a database user;
   assign the user to the database with all privileges.
3. In phpMyAdmin, select your database and import `database/schema.sql`.
4. Edit `config.php` and update `$DB_HOST`, `$DB_NAME`, `$DB_USER`, `$DB_PASS`
   with the cPanel credentials.
5. Browse to your domain and sign in.

## File structure

```
maya-php/
├── README.md
├── config.php              ← DB config + brand constants
├── index.php               ← Home / contact form
├── login.php               ← Sign in
├── register.php            ← Customer self-registration
├── logout.php
├── forgot-password.php     ← OTP-based reset (demo mode shows OTP)
├── track.php               ← Public tracking page
├── dashboard.php           ← Role-aware dashboard (Chart.js monthly chart)
├── shipments.php           ← Shipment list with filters
├── shipment.php            ← Detail view + status update / invoice / delete
├── new-shipment.php        ← Create shipment
├── profile.php             ← Account settings + change password
├── users.php               ← Admin: manage users & staff permissions
├── staff-activity.php      ← Admin: staff productivity leaderboard
├── database/
│   └── schema.sql          ← MySQL schema + default admin
├── includes/
│   ├── functions.php       ← Auth, formatters, helpers
│   ├── header.php          ← Site header / navbar
│   └── footer.php          ← Site footer + WhatsApp button
└── assets/
    ├── css/style.css       ← All app styling (brand colors)
    └── images/maya-logo.jpeg
```

## Roles & permissions

| Role     | Capabilities |
|----------|--------------|
| admin    | All permissions auto-enabled. Can manage users, edit staff permissions, see staff activity. |
| staff    | Per-user toggles for `can_manage_shipments`, `can_manage_customers`, `can_generate_invoice`. |
| customer | Self-register, book shipments for themselves, view only their own shipments, generate their own invoices. |

## OTP password reset

The app supports a multi-step OTP reset (request → verify → set new password).
By default `OTP_DEMO_MODE = true` in `config.php`, which **displays the OTP
on the page** instead of sending it (so you can test the flow without an SMTP
server). To send real codes:

1. Set `OTP_DEMO_MODE` to `false` in `config.php`.
2. In `forgot-password.php`, replace the comment
   `// In production: send via email/SMS here.` with a call to your mailer
   (PHPMailer, `mail()`, SendGrid, Twilio, etc.) using `$code` and `$email`.

## Configuration constants (`config.php`)

| Constant | Purpose |
|----------|---------|
| `SITE_NAME`, `SITE_TAGLINE` | Brand strings |
| `CONTACT_PHONE`, `CONTACT_PHONE_INTL` | Phone number; the `_INTL` version is used for the WhatsApp link |
| `CONTACT_EMAIL`, `CONTACT_ADDRESS` | Shown in footer + contact section |
| `GOOGLE_MAPS_QUERY` | Address slug for the embedded map iframe |
| `OTP_RECOVERY_EMAIL`, `OTP_RECOVERY_PHONE` | Help contacts shown on the reset page |
| `OTP_DEMO_MODE` | When `true`, OTP is shown on screen instead of sent |

## Security notes

- All forms use a CSRF token from the user's session.
- All DB queries use PDO prepared statements.
- Passwords are hashed with `password_hash()` (bcrypt) and verified with
  `password_verify()`.
- Sessions are regenerated on login (prevents session fixation).
- All user-supplied output is escaped with `htmlspecialchars()` via the
  `e()` helper.
- For production, also: enable HTTPS, set `session.cookie_secure = 1`,
  `session.cookie_httponly = 1`, and `session.cookie_samesite = "Lax"` in
  `php.ini`, and change the default admin password immediately after first
  login.

## License

Private project for Maya Import Export Logistic.
