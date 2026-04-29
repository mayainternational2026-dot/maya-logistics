# Threat Model

## Project Overview

Maya Import Export Logistic is a logistics management web app for a cargo company. A React + Vite frontend (`artifacts/maya-logistics`) talks to an Express 5 API (`artifacts/api-server`) over cookie-based sessions, with PostgreSQL for persistent storage via Drizzle ORM. Public users can browse the site, submit contact and product inquiry forms, and track shipments by tracking ID; authenticated customers can manage their own shipments; authenticated staff and admins can manage shipments, inquiries, users, and dashboard data.

Production scope for this scan is limited to the deployed React frontend and Express API. The mockup sandbox is never deployed to production. The imported `maya-php/` tree, archives, scripts, and other development artifacts should be treated as dev-only unless a future change makes them reachable from the production app. Replit handles TLS termination in production, and `NODE_ENV` is assumed to be `production` when deployed.

## Assets

- **Admin, staff, and customer accounts** — session cookies, password hashes, password-reset codes, and role/permission assignments. Compromise allows shipment manipulation, user management, and data access.
- **Shipment data** — sender/receiver identities, contact details, origins, destinations, payment state, internal notes, and tracking identifiers. This includes both customer-visible and staff/admin-only data.
- **Customer and inquiry data** — names, emails, phone numbers, inquiry descriptions, uploaded image payloads, and contact messages. This is business-sensitive and often contains personal data.
- **Application secrets and trust anchors** — session secret, SMTP credentials, and any seeded administrative credentials. Compromise of these values can enable account takeover or abuse of outbound email.
- **Operational integrity** — shipment status changes, invoice/payment state, and staff activity data. Unauthorized modification directly affects the business and customer trust.

## Trust Boundaries

- **Browser to API** — every request from the public site or dashboard crosses from an untrusted client into the Express API. All request bodies, params, headers, and query strings must be treated as attacker-controlled.
- **API to PostgreSQL** — the API has broad database access. Any broken authorization or injection issue at the API layer exposes the full data store.
- **API to email provider** — the API sends email through Gmail SMTP using privileged credentials. User-controlled content that reaches email templates or email-triggering flows crosses into a third-party messaging channel.
- **Public to authenticated boundary** — `/`, `/track`, `/inquiry`, `/api/contact`, `/api/inquiries`, and auth/recovery routes are public; shipment management, inquiries management, dashboard, and user-management routes require authentication and role checks.
- **Customer to staff/admin boundary** — customers should be confined to their own shipments and profile data. Staff/admin routes expose cross-customer business data and privileged actions.
- **Dev-only to production boundary** — `artifacts/mockup-sandbox`, `maya-php/`, archives, and scripts may contain insecure patterns but are out of scope unless wired into the deployed entry points.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/*.ts`, `artifacts/maya-logistics/src/App.tsx`, `artifacts/maya-logistics/src/main.tsx`.
- **Highest-risk code areas:** `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/lib/auth.ts`, `artifacts/api-server/src/lib/startup-seed.ts`, `artifacts/api-server/src/routes/users.ts`, `artifacts/api-server/src/routes/shipments.ts`, `artifacts/api-server/src/routes/inquiries.ts`, `artifacts/api-server/src/lib/mailer.ts`.
- **Public surfaces:** tracking, registration/login/password reset, contact form, inquiry submission.
- **Authenticated/admin surfaces:** users management, dashboard, inquiry management, shipment mutation endpoints.
- **Usually ignore unless reachability changes:** `artifacts/mockup-sandbox/**`, `maya-php/**`, `scripts/**`, archives and screenshots.

## Threat Categories

### Spoofing

The application relies on password authentication plus server-side sessions stored in PostgreSQL. The system must ensure that only legitimate users can authenticate, that privileged admin/staff identities cannot be recreated from seeded defaults or predictable credentials, and that password-reset and registration-verification flows cannot be brute-forced or bypassed. Session cookies must remain bound to the authenticated account and must not become forgeable because of predictable secrets or unsafe startup logic.

### Tampering

Customers, staff, and admins all submit mutable business data into the API: shipment records, payment state, inquiry status, contact details, and email-triggering fields. The server must enforce all business rules server-side, validate public input before persisting it, and ensure customer-controlled fields cannot be used to tamper with downstream admin views, tracking output, or outbound email content.

### Information Disclosure

Shipment records, inquiry submissions, contact messages, and user lists contain personal and business-sensitive information. Public tracking must reveal only the minimum data necessary, authenticated routes must scope data to the current role, and admin/staff-only views must not become reachable through ID guessing or client-side-only checks. Logs and API responses must avoid exposing secrets, password-reset material, or internal operational details.

### Denial of Service

Several public endpoints (`/api/auth/*`, `/api/contact`, `/api/inquiries`, shipment tracking) are reachable without authentication. The system must prevent unauthenticated users from abusing these routes for brute force, spam, or resource exhaustion, especially where email delivery or database writes are involved.

### Elevation of Privilege

The main privilege boundary is between customers and internal users, and between staff and admin. All shipment, inquiry, dashboard, and user-management routes must enforce authorization on the server, not just in the React UI. The application must also prevent public inputs, stored content, or predictable credentials from being turned into admin account takeover or privileged action execution.