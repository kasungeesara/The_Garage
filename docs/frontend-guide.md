# AutoPart Hub frontend

The existing design now uses the NestJS/PostgreSQL API. `MarketplaceProvider` replaces the old browser-local demo store. Accounts, seller identities, listings and conversations come from the server; no sample account bypass remains.

See [the full backend and deployment guide](backend-production-guide.md) for setup, API commands, permissions, testing and deployment limitations.

```sh
npm ci
npm run dev
```

The combined dev command starts the backend after checking database migrations. The frontend proxies `/api/*`; `BACKEND_URL` defaults to `http://127.0.0.1:4000`.

Customer pages require a session, seller pages require a store, and administrator pages require the Admin role. These UI guards complement independent API authorization. The support inbox is `/admin/contact`. Existing legacy auth URLs redirect to the current design.

Run the real-backend smoke test in `scripts/production-smoke.cjs`; the previous demo-only smoke script is no longer applicable. The new test uses isolated database records and real API requests.

See [the project structure and file finder](project-structure.md) for routes, feature files, shared UI and backend entry points.
