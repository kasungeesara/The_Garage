> **Update: email verification removed.** Signup opens the dashboard immediately. Existing/new accounts can create seller profiles and listings without email verification. The verification UI/API is retired. Email changes require the current password, apply immediately and revoke sessions. Seller verification and listing moderation remain separate admin workflows. SMTP is still needed for password resets and optional email notifications. Historical test results below describe their original run.

# AutoPart Hub backend and production setup

The existing visual design now uses the NestJS/PostgreSQL backend. Sample accounts, sample listings and localStorage mutations have been removed. This document describes the implementation, API contract, operating procedure and remaining deployment decisions. It is not a claim that the site has been deployed or load-tested for an unspecified traffic target.

## Feature map

| UI | Backend behavior |
| --- | --- |
| Signup / sign in / sign out | Validated accounts, bcrypt password hashes, persistent HttpOnly sessions and revocation |
| Email verification | Removed; signup opens the dashboard immediately |
| Forgotten / reset password | Enumeration-neutral request response, single-use reset token, all sessions revoked on reset |
| Profile | Persist name, phone and city; immediate email change with current-password confirmation |
| Preferences | Persist enquiry and email preferences; email notifications follow the account preference |
| Marketplace / filters / details | Published database listings, reference data, public seller profiles, real photos |
| Seller registration / settings | Private registration reference, public store, seller role and pending verification |
| Seller listings | Create/edit drafts, upload images, submit for moderation, pause, renew, mark sold, archive and soft-delete |
| Favourites / history | Per-account database collections; history shows the 20 latest viewed parts |
| Enquiries / replies | Private buyer–seller conversations, participant checks and closed-conversation rules |
| Reviews | Verified seller + actual seller reply required; one review per buyer/seller; only seller can reply |
| Notifications | Server-generated notifications; only recipient can mark read |
| Reports | Signed-in users report a listing; administrators resolve or dismiss with a note |
| Admin users | Suspend/restore customer and seller accounts; suspension revokes sessions |
| Admin verification | Inspect private seller reference, approve/reject and retain review note |
| Admin listing moderation | Approve/reject submissions; reason required for rejection; seller notified |
| Admin featured listings | Feature published listings |
| Journal / news | Admin draft/edit/publish/delete articles; public sees published articles only |
| Reference data | Admin-managed categories, brands, models and locations |
| Analytics | Daily deduplicated listing views; database listing and enquiry counts |
| Audit log | Server-generated administrator actions; database trigger blocks update/delete |
| Contact | Persist support submissions; `/admin/contact` displays the inbox and open/resolved status |

The design has no online checkout, payment gateway, shipping integration or social login. These are not silently simulated. Identity verification is a human administrator review of the supplied reference, not an external KYC service or document upload integration.

## Architecture

```text
Browser → same-origin /api/* → Next.js rewrite (development)
                           → Nginx → NestJS (production example)
NestJS → PostgreSQL: users, sessions, marketplace records, photos, outbox, rate limits
Outbox worker → configured SMTP server → account email inbox
```

- `src/providers/marketplace-provider.tsx` loads server state, refreshes on focus/every minute, prevents overlapping mutations and displays failures.
- `src/features/marketplace/commands.ts` translates existing form changes into named API commands. It does not send a writable whole-database snapshot. Each command is validated and authorized again on the server.
- `src/lib/api.ts` sends same-origin JSON requests with credentials and the CSRF header. Passwords and session tokens are not stored in browser storage.
- `backend/src/modules/marketplace/` owns reads, business commands, photos, support and view tracking.
- `backend/src/modules/auth/` owns credentials, sessions, verification/reset and email delivery.
- `backend/src/database/migrations/` contains tracked additive migrations. `001_auth.sql` is preserved; `002_marketplace.sql` extends existing accounts; `003_rate_limits.sql` adds shared request limits.

The provider preserves the design's shared UI state shape. Successful writes are followed by an authoritative reload; a failed write does not generate a success message or navigate away from the form. Multi-command UI updates are currently sent sequentially; each command is atomic, while the entire set is not a distributed transaction.

## Local setup

Use Node.js **22.12+** and PostgreSQL. Install both projects independently:

```sh
npm ci
npm --prefix backend ci
```

Create `backend/.env` from `backend/.env.example` only if it does not already exist. Configure the database, then run from the repository root:

```sh
npm run dev
```

This checks/applies pending local migrations, starts NestJS, waits for its health endpoint and starts Next.js against the correct backend port. It refuses production mode. If you manage processes separately, use `npm run dev:api` and `npm run dev:web` after applying migrations.

The default frontend is `http://localhost:3000`; the API binds to `127.0.0.1:4000`. `FRONTEND_ORIGIN` must match the browser origin exactly, including the port and no trailing slash. Next.js `BACKEND_URL` defaults to `http://127.0.0.1:4000` and is evaluated when the configuration loads/builds.

Existing real accounts remain intact and receive the `Customer` role and unverified email status. No sample users, listings or passwords are seeded. Only initial reference options are seeded.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set `production` for production; enables HTTPS requirements and Secure cookies |
| `PORT` | NestJS port; default 4000 |
| `FRONTEND_ORIGIN` | Public HTTPS origin in production |
| `BACKEND_URL` | Frontend rewrite destination; root environment only |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection; password is required |
| `DB_SSL` | Set `true` for managed PostgreSQL requiring TLS |
| `DB_SSL_CA` | Optional PEM root CA; literal `\n` is supported; certificate verification stays enabled |
| `SESSION_DAYS` | Session duration, 1–30, default 7 |
| `SMTP_HOST`, `SMTP_PORT` | SMTP host and port (default 587) |
| `SMTP_SECURE` | `true` for implicit TLS, normally port 465; otherwise STARTTLS in production |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials; omit authentication only for an intentionally unauthenticated local test server |
| `MAIL_FROM` | Verified sender address; e.g. `AutoPart Hub <noreply@your-domain>` |
| `VIEW_HASH_SECRET` | Random secret of at least 32 characters in production |
| `TRUST_PROXY` | Empty by default. `loopback` only for the supplied same-host trusted reverse proxy |

Production startup fails without HTTPS, SMTP host, sender address and a sufficiently long view hash secret. SMTP credentials and DNS/sender verification must be configured with your provider; having variables present does not prove delivery works.

Generate a secret locally:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not copy credentials into frontend code, documentation or Git. `.env` files remain ignored.

## Authentication and authorization

Passwords are SHA-256 prehashed before bcrypt cost 12. Session cookies contain random 256-bit tokens; PostgreSQL stores their SHA-256 hashes. Cookies are HttpOnly, SameSite=Lax, scoped to `/api`, and Secure in production. Login serializes with account updates so password reset/suspension cannot race an old-password login into retaining a session.

Email links contain tokens in the URL fragment, avoiding normal HTTP URL/referrer logging. The form submits the token only when the user confirms. Tokens expire after 15 minutes and are consumed atomically. Password reset revokes every existing session; the user signs in again.

Registration never accepts roles. A customer creates their own store to become a seller. Store ownership is the immutable user ID, not a display name or a fixed sample slug. Only administrators can approve listings or perform moderation. Administrators cannot suspend themselves or other administrators through the web UI.

Bootstrap an administrator after creating the intended account:

```sh
cd backend
npm run admin:promote -- owner@your-domain
```

This operator-only command records an audit entry and revokes that account's sessions. Sign in again to use `/admin`. There are no default administrator credentials and no public role-upgrade endpoint.

Every API write requires `X-Garage-Client: web`; if `Origin` is supplied it must match `FRONTEND_ORIGIN`. CORS is disabled. UI route guards improve navigation, while the API independently enforces roles, ownership and conversation participation.

## HTTP API

Responses are JSON, except media bytes and 204 logout. Authenticated endpoints accept the session cookie. Errors use NestJS `{statusCode, message, error}` responses. Validation failures are 400, absent sessions 401, denied permissions 403, unavailable resources 404, duplicates 409, and request limits 429.

| Method / path | Request or response |
| --- | --- |
| `POST /api/auth/signup` | `{name,email,password,phone,city}` → `{user}` and session cookie |
| `POST /api/auth/login` | `{email,password}` → `{user}` and session cookie |
| `GET /api/auth/me` | Current `{user}` or 401 |
| `POST /api/auth/change-email` | Signed-in `{email,password}` → update immediately; revoke sessions |
| `POST /api/auth/logout` | `{}` → 204; revoke current session |
| `POST /api/auth/forgot-password` | `{email}` → same neutral response for eligible and unknown accounts |
| `POST /api/auth/reset-password` | `{token,password}` → `{ok:true}`; revoke all sessions |
| `GET /api/state` | Public marketplace + authenticated account's permitted records; `Cache-Control: no-store` |
| `POST /api/commands` | `{action,data}`; see command table below |
| `POST /api/media` | Signed-in `{image:"data:image/png;base64,..."}` → `{url:"/api/media/UUID"}` |
| `GET /api/media/:id` | JPEG bytes for a public listing photo, the owner or an administrator |
| `POST /api/listings/:id/view` | `{}` → deduplicated daily view |
| `POST /api/contact` | `{name,email,topic,message}` → `{id}` |
| `GET /api/health` | Database health probe → `{status:"ok"}` |

`/api/state` never exposes password hashes, session tokens, email tokens or the email outbox. Anonymous users receive no users directory, reports, private conversations, verification references or support messages. An administrator receives management records; conversations still require participation.

## Command contract

All commands use `POST /api/commands` with `{ "action": "…", "data": { … } }`. The server never accepts client-authored audit logs, notification recipients, owner IDs, review author names, view counts or role changes as authoritative.

| Action | Data | Permission |
| --- | --- | --- |
| `profile.save` | `name,phone,city,email` (email must match existing) | Current account |
| `preferences.save` | `email:boolean,enquiries:boolean` | Current account |
| `store.save` | `name,city,description,type,reference` | Signed-in account; own store |
| `verification.request` | `{}` | Own store |
| `listing.save` | `id,slug,title,category,brand,model,year,fuel,transmission,price,condition,city,description,images,status` | Seller; status Draft/Pending only |
| `listing.status` | `id,status` | Owner, permitted lifecycle transition |
| `listing.delete` | `id` | Owner; soft-delete and clear saved/history references |
| `favourite.set` | `id,saved:boolean` | Current account; visible listing |
| `recent.add` / `recent.clear` | `id` / `{}` | Current account |
| `enquiry.create` | `id,partId,text` | Buyer; published listing from another seller |
| `enquiry.reply` | `id,text` | Buyer or seller participant; open conversation |
| `enquiry.status` | `id,status` | Participant; New/Read/Replied/Closed |
| `review.create` | `id,seller:slug,rating:1..5,text` | Eligible buyer; verified seller and an actual seller reply |
| `review.reply` | `id,reply` | Reviewed seller |
| `notification.read` | `id,read:boolean` or `id:"all"` | Recipient |
| `report.create` | `id,partId,reason` | Signed-in account |
| `admin.listing` | `id,status:Published/Rejected,note` | Admin; rejection note required |
| `admin.feature` | `id,featured:boolean` | Admin; published listing |
| `admin.user` | `id,status:Active/Suspended` | Admin; non-admin target |
| `admin.verification` | `id:userId,status:Approved/Rejected,note` | Admin |
| `admin.report` | `id,status:Resolved/Dismissed,note` | Admin |
| `admin.article.save` | `id,slug,title,category,excerpt,body,featured,status:Draft/Published` | Admin |
| `admin.article.delete` | `id` | Admin |
| `admin.references` | `kind,items:string[]` | Admin; Categories/Brands/Models/Locations |
| `admin.contact` | `id,status:Open/Resolved` | Admin |

UUIDs supplied by clients identify new records, but ownership and identity are assigned by the server. SQL uses bound parameters; status and reference options are validated. Each command runs in a transaction with an actor advisory lock and record locks where needed. Moderation audit entries and notifications commit with the decision.

Editing or renewing a published listing sends it back to moderation. Resuming a paused listing also requires moderation; owners cannot self-publish by forging a status. Deleted listings are hidden but retained so existing conversations and reports preserve their context.

## Media, email and analytics

Photos accept JPEG/PNG/WebP only, at most 5 MB input and 25 million decoded pixels. Sharp decodes, rotates, resizes to at most 1600×1600 and re-encodes to JPEG, stripping source metadata. The UI also downsizes images before upload. A listing can reference up to 10 photos belonging to its owner. Photos are durable PostgreSQL `BYTEA` records, not browser data URLs or ephemeral server files. Unattached photos remain private and are cleaned after seven days. The per-account upload ceiling is 500 images.

The email worker polls every ten seconds, claims one outbox record using `FOR UPDATE SKIP LOCKED`, and sends via SMTP. Failures are retried after five minutes, at most eight attempts. Sent message bodies are cleared. Delivery is **at least once**: if SMTP accepts a message and the database commit fails, a retry can send a duplicate. Multiple instances coordinate through PostgreSQL. Support form submissions are read in the admin inbox; they do not invent an external support email recipient.

View counts are deduplicated per listing/day using a salted daily hash of the request IP; they are approximate traffic metrics, not unique people or sales conversions. Raw IPs are not stored in the view table. Charts use UTC days. Configure a trusted ingress correctly or all proxy users will share the same apparent IP.

Rate limits are shared in PostgreSQL, including across API instances. The default is 120 requests per minute per handler/IP, with stricter signup, login, recovery, contact and upload limits. These limits rely on the real ingress IP, not arbitrary browser-supplied forwarding headers.

## Deployment procedure

1. Provision PostgreSQL and separate migration/operator and runtime database roles. Take a backup before applying schema changes.
2. Set backend production environment variables and real SMTP credentials. Verify sender domain/DNS using the provider's instructions.
3. Install and build both projects. Apply migrations from the backend directory using the migration role.
4. Run NestJS as a supervised long-lived process on loopback port 4000 and Next.js on port 3000. Retain the source SQL/dev tooling in the migration job, or run migrations during the release stage before pruning dev dependencies.
5. Terminate HTTPS at the reverse proxy. Adapt `deploy/nginx.conf.example`; it routes `/api/` directly to NestJS and overwrites forwarded client headers. Set `TRUST_PROXY=loopback` only for that topology. Do not expose port 4000 publicly.
6. Create the operator account, then run `admin:promote`. No real administrator was created automatically by this change.
7. Exercise signup, actual received password recovery mail, image upload and moderation through the deployed HTTPS domain before inviting users.
8. Schedule maintenance, database backups, restore drills, process restarts and monitoring.

```sh
npm ci
npm --prefix backend ci
npm --prefix backend run db:migrate
npm --prefix backend run build
npm run build
# Separate supervised services:
npm --prefix backend start
npm start
```

For environments where Turbopack cannot bind its build worker port:

```sh
npm run build -- --webpack
```

Use `npm --prefix backend run maintenance` daily. It removes expired sessions/tokens/rate buckets, old outbox records and unattached old media, and reports exhausted email jobs. It does not delete users, enquiries or audit history. Decide and document business retention policies before launch.

The runtime DB role should have only required table DML; no DDL, schema ownership or superuser privileges. Grant only SELECT/INSERT on `audit_logs`, and restrict all administrative/operator credentials. The audit trigger protects against normal SQL updates/deletes, not a privileged database owner who can disable triggers or truncate tables. Database access, backups and outbox contents contain sensitive data and must be protected.

Monitor `/api/health`, application 5xx rates, database pool saturation, SMTP retries/exhausted jobs and storage growth. The outbox worker is part of the Nest process, so a serverless process that stops between requests is not suitable without a separately running worker.

## Verification

```sh
npx tsc --noEmit
npm run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm run build -- --webpack
```

The PostgreSQL tests create randomly named schemas and drop only those schemas. They preserve application accounts. They cover the auth lifecycle, CSRF, validation, token reuse, suspension, cross-account authorization, private drafts/photos/messages, moderation, reviews, reports, articles, support and append-only audit behavior.

Real-browser smoke test (requires Playwright and Chrome):

```sh
npm run test:browser:build
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
CHROME_PATH=/absolute/path/to/chrome \
npm run test:browser
```

The browser build uses `.next-smoke`, so it cannot replace the normal `.next` build with the test backend port. The script starts temporary services on 3127/4127, uses an isolated PostgreSQL schema, and tests signup, verification using the test outbox, seller onboarding, photo upload, moderation, enquiries, role guards, logout and invalid-password errors. It does not deliver email externally.

## Deployment decisions and limits

- Real domain, hosting topology, SMTP account, sender DNS, production database and backup service must be supplied/configured by the operator. They have not been deployed by editing this repository.
- Email delivery must be tested with the actual provider; checking the outbox and token lifecycle alone is insufficient.
- The current design loads a server-authorized aggregate state response and filters/paginates listings in the browser. This suits a small initial marketplace, but it has no bounded server-side catalogue pagination and has not been load-tested. Large catalogues require paginated resource reads, indexed server-side search and a documented traffic target before a high-volume launch.
- Media currently uses PostgreSQL and a 500-image account quota. For large volumes, migrate to private object storage with a public moderated-media delivery path and lifecycle policies.
- Profile email changes require the current password, apply immediately and revoke existing sessions.
- Legal terms/privacy copy remains a draft requiring actual operator details and retention decisions. This implementation does not establish those business policies.
- No billing, external KYC, live chat sockets, delivery service or external analytics provider is configured. Existing enquiry-based buying/selling works through database-backed messages and refreshes.

## Dependency references

The backend explicitly declares its own SMTP/image libraries and pins the patched multipart dependency used by Nest. The image patch was checked against the [Sharp security advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c); the multipart patch against the [Multer advisory](https://github.com/advisories/GHSA-wc9g-mqfw-jrwm). SMTP integration follows [Nodemailer usage](https://nodemailer.com/usage/). Re-run dependency audits as part of releases; a clean audit on one date is not a lasting security guarantee.

## Troubleshooting local startup

- Start both services with `npm run dev`, then open `http://localhost:3000`. Starting only Next.js does not start the API.
- `relation does not exist` / missing role or token columns: apply pending migrations; the combined dev command does this automatically.
- For a previous production build pointing at a test port, run `npm run build -- --webpack` with the normal `BACKEND_URL` (default 4000). New smoke builds use `.next-smoke`.
- Verify `http://localhost:3000/api/health` returns `{"status":"ok"}`. Frontend and backend must agree on port and `FRONTEND_ORIGIN`.
- No verification/reset mail: configure SMTP in `backend/.env`; no SMTP provider is configured by default. Do not disable verification to bypass missing email configuration.

## Local verification completed — 10 September 2026

- Applied migrations 002–004 to the configured local development database; existing accounts retained.
- Local Next.js on port 3000 and NestJS on port 4000 return working health/state endpoints. Current and legacy login URLs render.
- Restored the normal production build rewrite to port 4000; isolated smoke build uses 4127 under `.next-smoke`.
- PostgreSQL auth and marketplace integration suites pass, including verification, reset/email-change token consumption and role/ownership checks.
- Real-browser signup, verification, seller onboarding, photo upload, moderation, enquiry/reply, admin denial, logout and incorrect-password journeys pass.
- Read-only live browser regression passes: API failure/retry preserves the login form; homepage renders at mobile/tablet/desktop widths without runtime errors.
- Webpack production build and TypeScript pass. ESLint has no errors; two pre-existing image optimization warnings remain in legacy vehicle components.
- SMTP is not configured in the local `.env`. Real inbox delivery remains pending provider configuration; tests inspect isolated test outboxes and do not claim external delivery.

### Port 4000 already in use

`npm run dev` already starts both services. Do not also start a second backend. The backend `npm run start:dev` command now detects a healthy existing listener and exits without starting a duplicate. An occupied but unhealthy port is reported explicitly. Failed Nest listeners close their database pool and email worker before exiting.

The combined `npm run dev` command also detects an existing frontend on port 3000 and verifies its API proxy. Running it again reuses healthy services instead of starting a duplicate frontend. An occupied port with a failed health check is reported explicitly; the command does not kill unrelated listeners.

## Single administrator rule

Only one account can hold the Admin role, including suspended accounts. Migration `006_single_admin.sql` enforces this with a partial unique index. `admin:promote` rejects a second administrator; running it for the current active administrator is a no-op and preserves their sessions. Existing databases with multiple admins fail migration without demoting anyone automatically.
