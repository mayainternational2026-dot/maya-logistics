# Maya Import Export Logistic

A logistics management web app for Maya Import Export Logistic, a Nepali cargo company shipping freight by air, sea, and road from Kathmandu to the world.

## Key Features

- 7-stage shipment tracking: pending → collected → at_warehouse → customs_clearance → in_transit → arrived → delivered
- Role-based access: admin / staff / customer
- SMTP email notifications via Gmail (nodemailer) on status changes and payment confirmation
- Printable invoice page at `/shipments/:id/invoice`
- Product inquiry form at `/inquiry` (with image upload, product link, quantity, estimated value)
- Admin inquiries management at `/admin/inquiries` with status workflow (pending → reviewing → quoted → closed)
- Chat support bot (floating widget, rule-based FAQ, WhatsApp escalation) on every public page
- WhatsApp button linking to `wa.me/9779744732123` on every public page

## Tech stack

- **Monorepo**: pnpm workspaces with TypeScript project references
- **Frontend**: React + Vite + wouter + TanStack Query + Tailwind + shadcn/ui (artifact `maya-logistics`, port 25999, base path `/`)
- **API**: Express 5 (artifact `api-server`, port 8080) with `pino-http`, `cors`, `express-session` + `connect-pg-simple` for cookie sessions
- **DB**: PostgreSQL via Drizzle ORM (`@workspace/db`)
- **API contract**: OpenAPI 3 in `lib/api-spec`, codegen produces Zod schemas (`@workspace/api-zod`) and React Query hooks (`@workspace/api-client-react`)
- **Auth**: bcrypt-hashed passwords + httpOnly session cookies. Frontend monkey-patches `window.fetch` in `src/main.tsx` to send `credentials: "include"` on every request.

## Roles

Three roles enforced server-side:

- **admin**: full access (users, shipments, dashboard, staff activity)
- **staff**: scoped by per-user permissions (`canManageShipments`, `canManageCustomers`, `canGenerateInvoice`)
- **customer**: can register, book shipments for themselves, view only their own shipments, generate their own invoices

## Default seed accounts

| Email | Password | Role |
| --- | --- | --- |
| chapagainsirish@gmail.com | Sirish@@2054 | admin |
| sangita@maya.com | staff123 | staff (full perms) |
| bikash@maya.com | staff123 | staff (no customer mgmt) |
| aarati@example.com / rohan@example.com / pemba@example.com | customer123 | customer |

3 demo shipments per customer are seeded in the dev database.

## Key features

- Public marketing/home page with services, embedded Google Map of Anandamaya Marg, Dhumbarahi, Kathmandu, contact form, and an inline tracking widget.
- Public tracking page at `/track` and `/track/:trackingId` with status timeline (Pending → In Transit → Delivered).
- Email + password auth with multi-step OTP-based password reset (OTP returned in API response in demo mode and surfaced inline as a "Demo OTP" banner).
- Role-aware dashboard: staff/admin see KPI cards, monthly revenue + shipment volume chart (Recharts), recent shipments; customers see their own active shipments and total spent.
- Shipments list with status filter + free-text search; admin/staff see everything, customers see only their own (server-enforced).
- Shipment detail with status update + delete (admin/staff with permission), Generate Invoice deep-link to `https://invoice-generator.com/` with prefilled NPR pricing and shipment metadata.
- Admin Users page: create staff/customers, edit per-user permissions, reset passwords, delete users.
- Staff Activity leaderboard for admin.
- Floating WhatsApp button on every page → `https://wa.me/9779744732123`.
- Brand: deep navy + crimson red + white, with Nepali flag accents — sourced from the company logo at `public/maya-logo.jpeg`.

## Repository layout

- `lib/api-spec/openapi.yaml` — single source of truth for the API contract
- `lib/api-zod` — generated Zod schemas (re-exported from `src/index.ts`)
- `lib/api-client-react` — generated React Query hooks
- `lib/db/src/schema/` — Drizzle tables (users, permissions, shipments, password_resets, contact_messages, sessions)
- `artifacts/api-server/src/routes/` — auth, users, shipments, dashboard, contact
- `artifacts/api-server/src/lib/auth.ts` — session middleware + `requireAuth(...roles)` guard
- `artifacts/maya-logistics/src/pages/` — Home, Track, auth/, Dashboard, shipments/, admin/, Profile
- `scripts/src/seed.ts` — idempotent seed script (run with `pnpm --filter @workspace/scripts run seed`)

## Running locally

Workflows are configured automatically:

- `artifacts/api-server: API Server` — Express on port 8080
- `artifacts/maya-logistics: web` — Vite on port 25999

To re-seed the database: `pnpm --filter @workspace/scripts run seed`

## Deployment & Custom Domain

The production deployment runs on Replit Autoscale and is reachable at:

- **Replit URL**: `https://logistics-hub-mayainternatio1.replit.app` (always serves latest published code)
- **Target custom domain**: `www.mayaimportexport.com`

### DNS migration status (verified 2026-06-28)

As of June 28 2026, `www.mayaimportexport.com` still resolves to Railway (IP `69.46.46.79`).
The Replit deployment resolves to IP `172.24.0.5`.

To complete the cutover, two manual steps are required:

**Step 1 — Add domain in Replit**
1. Open this project → **Deploy** → **Custom Domains**
2. Click **Add domain** → enter `www.mayaimportexport.com`
3. Copy the **CNAME target** Replit shows (e.g. `logistics-hub-mayainternatio1.replit.app`)

**Step 2 — Update DNS at the registrar**
Log in to the registrar where `mayaimportexport.com` was purchased and set:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | *(Replit CNAME target from Step 1)* |

Remove or replace any existing `www` CNAME pointing to Railway.

DNS propagation takes 5–30 minutes. Replit will automatically provision TLS once the CNAME resolves.
After this is done, every future Replit publish will update the live site automatically.

## Notes

- OTP delivery is currently demo-only — codes are returned in the API response and surfaced in the UI. Wire up SMTP or an SMS gateway to send real codes.
- Session secret is read from `SESSION_SECRET`. A development fallback is used if unset.
