# Project එකේ files හොයාගන්න guide එක

Frontend code එක `src/` තුළ. Backend code එක `backend/src/` තුළ.

```text
src/
  app/                         URL routes සහ layouts
    (marketplace)/             Public marketplace pages
    (legacy)/                  පැරණි URLs සඳහා redirects
    auth/                      Login, register, password reset routes
    dashboard/                 Customer routes
    seller/                    Seller routes
    admin/                     Admin routes
  features/                    Feature එකට අදාළ UI සහ logic
    auth/                      Auth form සහ auth API calls
    marketplace/               Home, catalog, parts, news
      components/              Marketplace-specific components
      commands.ts              Marketplace API commands
    account/                   Profile, enquiries, reviews
    seller/                    Listings, store settings, analytics
      components/              Seller-specific components
    admin/                     Moderation සහ admin content
  components/
    layout/                    Navbar, footer, workspace shell
    ui/                        Shared buttons, panels, icons
  lib/api.ts                   Shared HTTP request helper
  providers/                   Shared application state
  types/marketplace.ts         Marketplace types සහ money helper

backend/src/
  modules/
    auth/                      Login, signup, passwords, sessions
      dto/                     Request validation
      guards/session.guard.ts  Session authentication
    users/                     User database access
    marketplace/               Listings, enquiries, admin operations
  common/guards/               Features අතර shared guards
    origin.guard.ts            Origin සහ CSRF header check
  config/environment.ts        Environment configuration
  database/                    Database connection, migrations, tools
  main.ts                      Backend entry point
  setup.ts                     HTTP application setup
```

## මට වෙනස් කරන්න ඕනේ දේට අදාළ file එක

| වැඩේ | File |
| --- | --- |
| Homepage content | [home.tsx](../src/features/marketplace/home.tsx) |
| Login / register form | [auth-form.tsx](../src/features/auth/auth-form.tsx) |
| Login route | [page.tsx](../src/app/auth/login/page.tsx) |
| Register route | [page.tsx](../src/app/auth/register/page.tsx) |
| Auth API calls | [api.ts](../src/features/auth/api.ts) |
| Navbar | [navbar.tsx](../src/components/layout/navbar.tsx) |
| Footer | [site-footer.tsx](../src/components/layout/site-footer.tsx) |
| Shared UI | [kit.tsx](../src/components/ui/kit.tsx) |
| Shared state | [marketplace-provider.tsx](../src/providers/marketplace-provider.tsx) |
| Login backend logic | [auth.service.ts](../backend/src/modules/auth/auth.service.ts) |
| Signup / password reset logic | [account.service.ts](../backend/src/modules/auth/account.service.ts) |
| Auth API endpoints | [auth.controller.ts](../backend/src/modules/auth/auth.controller.ts) |
| Request origin error | [origin.guard.ts](../backend/src/common/guards/origin.guard.ts) |
| Ports / allowed origin / SMTP | `backend/.env` |
| Frontend API proxy | [next.config.ts](../next.config.ts) |
| Both services start command | [dev.mjs](../scripts/dev.mjs) |

## File එකක් කියවන්නේ කොහොමද?

Login flow එක: `src/app/auth/login/page.tsx` → `src/features/auth/auth-form.tsx` → `src/features/auth/api.ts` → backend `auth.controller.ts` → `auth.service.ts`.

- `page.tsx`: URL එකේ page එක. Feature component එක render කරනවා.
- `layout.tsx`: Pages කිහිපයකට shared layout එක.
- `*.controller.ts`: Backend API endpoints.
- `*.service.ts`: Backend business logic.
- `*.repository.ts`: Database reads සහ writes.
- `*.dto.ts`: Request fields validate කරනවා.
- `*.guard.ts`: Request permissions / security checks.

`(marketplace)` සහ `(legacy)` route groups නිසා URL එකට ඒ folder names එකතු වෙන්නේ නැහැ. `[id]` සහ `[slug]` dynamic URL values.

`src/app/auth/verify-email/page.tsx` පැරණි route එකක්; දැන් `/dashboard` එකට redirect කරනවා. `src/app/(legacy)/components/auth/` යටතේත් redirects පමණයි.

අලුත් feature-specific files අදාළ `src/features/<feature>/` එකට දාන්න. Features කිහිපයක් භාවිතා කරන UI `src/components/` එකට දාන්න. Imports සඳහා `@/` යනු `src/` යි; `@/public/` පමණක් root `public/` එකට යොමු වෙනවා.

## Run සහ checks

```sh
npm run dev                  # Frontend + backend
npm run dev:web              # Frontend only
npm run dev:api              # Backend only
npm run build                # Frontend production build
npm --prefix backend test    # Backend build + unit tests
```

Files move කිරීමෙන් පසුව කලින් run වෙමින් තිබුණු dev server එක Ctrl+C දී නවතා නැවත `npm run dev` කරන්න.
