# AutoPart Hub API

NestJS and PostgreSQL backend for accounts, seller listings, images, enquiries, reviews, notifications, moderation, articles, support and analytics.

See [the complete backend / production guide](../docs/backend-production-guide.md) for API contracts, schema, deployment, permissions, maintenance and tests.

Sinhala overview: [Backend guide](docs/backend-guide-si.md).

```sh
npm ci
# Configure .env using .env.example without overwriting existing credentials.
npm run db:migrate
npm run start:dev
```

Node.js 22.12+ and PostgreSQL are required. Production also requires HTTPS, SMTP and a view hash secret. There are no default users or administrator passwords.

```sh
npm test
npm run test:e2e
npm run build
```
