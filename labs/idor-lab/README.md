# IDOR Lab — Broken Access Control (AI-Sec)

An **intentionally vulnerable, educational-only** notepad built with a single Cloudflare Worker, Cloudflare D1, and static assets. No VM or traditional server is required.

## How the demonstration works

Each visitor receives an opaque, HttpOnly session cookie and **an isolated lab namespace** containing two fictional users (Alex and Sam). The visitor is always Alex. The API returns only Alex's notes in the note list. Sam owns a seeded fictional note.

1. Select **Vulnerable** mode. Open Alex's note in `/notes/<id>`.
2. Replace the ID with the displayed fictional Sam note ID. The API returns `200 OK` and Sam's seeded note even though the visitor is Alex: **IDOR**.
3. Select **Protected**. Reload the same Sam note URL. The API returns `403 Forbidden` because it checks the note owner.
4. Add a fictional note as Alex, then verify that Alex can still view it in protected mode.

**Isolation boundary:** even in vulnerable mode, the SQL query *always* filters by `lab_id`, so changing an ID **cannot read another visitor's lab**. No attendee can create or change Sam's fictional account. Never enter real credentials or personal data. This is a teaching lab, not an authentication system or a secure storage service.

## Project layout

```
labs/idor-lab/
  src/index.js             Worker API and demo authorization logic
  public/index.html        UI
  public/app.js            Browser interactions (safe text rendering)
  public/style.css         Styles
  migrations/0001_init.sql D1 schema
  test/lab.test.js         API behavior and isolation tests
  wrangler.jsonc           Worker configuration (this folder is the root)
```

## Setup and local verification

Requires Node.js 20+ and a Cloudflare account for deployment. From **this directory** (`labs/idor-lab/`):

```bash
npm install
npm test
npm run db:local
npm run dev
```

Open the local address printed by Wrangler (usually `http://localhost:8787`). The API's POST checks require a browser-origin request; use the UI rather than cross-site POSTs.

## Cloudflare deployment (manual, not performed by ChatGPT)

1. In Cloudflare, create a D1 database: `npx wrangler d1 create ai-sec-idor-lab`.
2. Copy its **database ID** into `d1_databases[0].database_id` in `wrangler.jsonc`. This identifier is not a secret.
3. Run `npm run db:remote` to apply the schema to your remote D1. Verify you selected the intended Cloudflare account.
4. Run `npm run deploy`; Wrangler prints your `*.workers.dev` URL.
5. In the Cloudflare Git integration, select `CaNakagawa/AI-Sec` and configure the project **root directory** as `labs/idor-lab`. The other top-level repository directories are not part of the Worker bundle. If you use automatic deployment, confirm build/deploy commands, D1 binding and root directory in Cloudflare before enabling it.

**Do not deploy before setting up D1 and reviewing the isolation controls.** The sample `database_id` value is deliberately invalid. The GitHub push alone does **not** deploy the Worker.

## Safe operation

- No real user accounts or private records. Sessions expire after 2 hours; an hourly cron removes expired labs and their notes.
- Cookies use `Secure`, `HttpOnly`, `SameSite=Strict`. Only same-origin JSON POSTs are allowed. The database stores a SHA-256 hash of the session token, not the raw token.
- Input length is limited to 240 characters and each lab to 10 notes. The browser renders user text with `textContent`, not HTML.
- The lab is intentionally vulnerable **only** to same-lab cross-user read access, for teaching IDOR; it is not suitable for use with confidential data.
- On an open public deployment, Cloudflare WAF/rate limiting and abuse monitoring are recommended; the per-lab limit does not stop a visitor from creating multiple sessions.
- This code is a demonstration, not a production-grade app. Test and review your deployment configuration before sharing the link publicly.

## Teaching point

> Authentication tells us *who* is making a request. Authorization decides *what they are allowed to access*. The server—not the URL or frontend—must enforce that decision.

Further reading: [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) · [Cloudflare D1](https://developers.cloudflare.com/d1/) · [Cloudflare Workers](https://developers.cloudflare.com/workers/)
