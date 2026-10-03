> **Update: email verification removed.** Signup opens the dashboard immediately. Existing/new accounts can create seller profiles and listings without email verification. The verification UI/API is retired. Email changes require the current password, apply immediately and revoke sessions. Seller verification and listing moderation remain separate admin workflows. SMTP is still needed for password resets and optional email notifications. Any older verification-specific instructions below are superseded.

# AutoPart Hub backend එක භාවිතා කරන හැටි

මේ frontend design එක දැන් demo data/localStorage මත වැඩ කරන්නේ නැහැ. Accounts, listings, enquiries, reviews සහ admin actions PostgreSQL database එකට සම්බන්ධ කරලා තියෙනවා.

සම්පූර්ණ API, database, security සහ deployment විස්තර: [Production backend guide](../../docs/backend-production-guide.md).

## පටන් ගන්න

1. Node.js 22.12 හෝ අලුත් version එකක් සහ PostgreSQL අවශ්‍යයි.
2. Root folder එකේ `npm ci` සහ `npm --prefix backend ci` run කරන්න.
3. `backend/.env.example` බලලා `backend/.env` configure කරන්න. දැනට තියෙන `.env` එක overwrite කරන්න එපා.
4. `npm --prefix backend run db:migrate` run කරන්න. පැරණි accounts මකන්නේ නැහැ; අලුත් tables/columns එකතු වෙනවා.
5. Root folder එකේ `npm run dev` run කරන්න. Backend සහ frontend දෙකම start වෙනවා; pending migrations ද check වෙනවා.

## User roles

- Customer: account, favourites, enquiries, reviews සහ notifications.
- Seller: email verify කරලා `/sell` හරහා store එකක් හදන්න. තමන්ගේ listings සහ enquiries පමණක් manage කරන්න පුළුවන්.
- Admin: listings approve/reject, seller verification, reports, users, news, reference data සහ support inbox.

Admin password එකක් hard-code කරලා නැහැ. සාමාන්‍ය account එකක් හදලා email verify කළාට පස්සේ operator terminal එකෙන්:

```sh
cd backend
npm run admin:promote -- your-email@example.com
```

ඊට පස්සේ නැවත sign in කරන්න. Public API එකෙන් තමන්ට Admin role දෙන්න බැහැ.

## Email සහ photos

Email verification/password reset ඇත්තටම inbox එකට යවන්න SMTP settings අවශ්‍යයි. ඒවා `.env` එකේ දාන්න. Email provider එක configure නොකළොත් database outbox එකේ email එක queue වෙනවා; inbox delivery එක සිදුවෙන්නේ නැහැ. Production mode එකට SMTP host සහ sender settings අනිවාර්යයි.

Photos browser එකේ පමණක් save කරන්නේ නැහැ. Backend එක photo එක validate/resize කරලා database එකේ save කරනවා. Pending listing photos owner සහ admin පමණක් බලනවා. Listing approve වුණාම marketplace එකට පෙන්වනවා.

## Tests

```sh
npm --prefix backend test
npm --prefix backend run test:e2e
npx tsc --noEmit
npm run build -- --webpack
```

Database tests වෙනම temporary schema එකක run වෙනවා. ඔබගේ සාමාන්‍ය accounts වෙනස් කරන්නේ නැහැ. Browser test run කරන හැටි සම්පූර්ණ guide එකේ තියෙනවා.

## Live කරන්න කලින්

Domain, hosting, SMTP credentials, sender DNS, production database සහ backups configure කරන්න. HTTPS domain එකෙන් verification/reset email ලැබෙනවාද කියලා test කරන්න. Terms/privacy operator details තවම draft. විශාල catalogue/traffic එකකට server pagination සහ load tests තවම අවශ්‍යයි. Code එක ලිවීම පමණක් live deployment එක සම්පූර්ණ කිරීමක් නොවෙයි; සීමාවන් සහ setup පියවර guide එකේ පැහැදිලිව දාලා තියෙනවා.
