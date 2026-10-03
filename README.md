> **Update: email verification removed.** Signup opens the dashboard immediately. Existing/new accounts can create seller profiles and listings without email verification. The verification UI/API is retired. Email changes require the current password, apply immediately and revoke sessions. Seller verification and listing moderation remain separate admin workflows. SMTP is still needed for password resets and optional email notifications. Any older verification-specific instructions below are superseded.

# AutoPart Hub

Vehicle parts marketplace with a Next.js frontend and a NestJS/PostgreSQL backend. The current design uses real accounts, seller listings, photos, enquiries, moderation and support records.

- [Backend API, database, production setup and tests](docs/backend-production-guide.md)
- [File structure සහ files හොයාගන්න guide එක](docs/project-structure.md)
- [Frontend guide](docs/frontend-guide.md)
- [සිංහල backend guide](backend/docs/backend-guide-si.md)

```sh
npm ci
npm --prefix backend ci
# Configure backend/.env from backend/.env.example.
npm run dev
```

`npm run dev` applies pending local migrations and starts both services. Use `npm run dev:web` and `npm run dev:api` only when managing the services separately.

Node.js 22.12+ and PostgreSQL are required. No sample users or default administrator passwords are seeded. Configure SMTP to deliver password-reset emails and optional notifications. Deployment settings and remaining launch decisions are documented in the backend guide.
# the_garage
