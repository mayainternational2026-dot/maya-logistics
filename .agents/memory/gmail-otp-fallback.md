---
name: Gmail SMTP credentials broken in dev; OTP fallback must trigger on send failure, not just missing config
description: Maya logistics app's GMAIL_APP_PASSWORD/GMAIL_USER env vars are present but invalid in this environment, and email-triggering flows must fall back to a visible OTP on actual send failure, not only when creds are absent.
---

In this project's dev environment, `GMAIL_USER`/`GMAIL_APP_PASSWORD` are set but SMTP auth fails ("Application-specific password required" — the stored value is not a real Gmail App Password). Any flow that gates a dev-only fallback on "is email configured?" (i.e. are the env vars present) rather than "did the send actually succeed?" will silently break for users, because the fallback never triggers even though no email is delivered.

**Why:** this exact bug blocked the password-reset flow end-to-end — the demo OTP fallback in `/auth/forgot-password` never appeared because `isEmailConfigured()` returned true, and the real send failed with no user-visible fallback. Fixed by awaiting the send and falling back on failure too (still gated by dev-only, so production never exposes OTPs).

**How to apply:** for any new or existing flow that emails a code/link and has a demo/dev fallback (e.g. registration OTP, any future notification-with-fallback), check whether it awaits the send and falls back on failure, not just on missing config. Do not assume `GMAIL_*` secrets being set means email delivery actually works in this environment — verify with a real send attempt before relying on it.
