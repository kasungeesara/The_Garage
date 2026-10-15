# Seller plans and checkout

The feature reuses Next.js App Router, the marketplace provider, session cookies, NestJS and PostgreSQL. Public pricing lives at `/seller-plans`; seller controls are at `/seller/subscription` and on the seller overview. An active Shop subscription enables `/sellers/[slug]`. Product purchase review lives at `/checkout/[listing-id]`.

## Current integration boundary

No payment gateway was configured in the project. Hosted checkout, provider signature verification, real gateway callbacks and product payment collection are **not implemented or enabled** pending the merchant's gateway choice. The UI reports this explicitly. Product checkout offers a frontend-only demo: preview payment, confirm the demo, watch a contactless terminal animation, then choose View receipt to see a thermal receipt print onto a dark background showing zero charged. The gold card entrance, tap, checkmark, loading dots, paper feed and demo stamp respect reduced-motion preferences. Replay print restarts the paper animation. It creates no order, reserves no inventory, requests no payment details and does not call the unavailable payment endpoint. A contact-seller link returns to the listing enquiry form. When the backend reports checkout availability, the payment button uses the hosted checkout endpoint. Checkout attempts create no orders and charge nothing. There is no browser-accessible subscription activation endpoint, and a success query string cannot activate a plan.

Product review checks sign-in, current listing availability, seller status, ownership and the price in PostgreSQL. It does not reserve inventory, collect payment or create a completed purchase. The merchant must choose whether the marketplace receives money and settles with sellers, or each seller receives money directly. That decision determines which gateway marketplace capabilities, settlement accounts, refunds, inventory reservations and product-order fulfillment are needed before enabling payment collection.

`SubscriptionsService.createShopOrder` and `recordVerifiedPayment` are internal integration seams. They have been tested using simulated, already-verified results, not live gateway requests. A future adapter must use the gateway's official hosted-checkout and webhook/verification documentation. It must verify the merchant, signature, order reference, amount, currency and payment result before invoking the internal confirmation method. Never call this method from a browser return URL. A gateway callback needs its own signature-verified route rather than the browser-only OriginGuard.

## Setup

1. Configure the existing backend database and frontend origin. Example values contain no real secrets:

   ```dotenv
   # backend/.env
   FRONTEND_ORIGIN=http://localhost:3000
   PORT=4000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=garagedb
   DB_USER=postgres
   DB_PASSWORD=replace-with-local-password
   # Retain the existing SMTP and security configuration from backend/.env.example.

   # root .env.local
   BACKEND_URL=http://127.0.0.1:4000
   ```

   Gateway-specific merchant ID, secret, sandbox/live mode and callback URL variables will be added after a gateway is selected. Those credentials must remain in backend environment variables; never use `NEXT_PUBLIC_` for secrets. Existing real `.env` files have not been changed.

2. Apply the schema, then build and start the project:

   ```sh
   npm --prefix backend run db:migrate
   npm --prefix backend run build
   npm run build -- --webpack
   npm run dev
   ```

   Migration `007_seller_plans.sql` adds expiry/contact/logo fields, listing preferences, payment orders and database enforcement. Existing sellers without a verified subscription use the Free Plan. Existing listing data is preserved. Legacy accounts with more than five active listings are reduced to five on the next marketplace read after migration; extra listings are paused.

3. Run the existing maintenance command regularly, for example once per minute through the deployment scheduler:

   ```sh
   npm --prefix backend run maintenance
   ```

   Marketplace and subscription reads also reconcile expired plans, so public shop visibility does not depend on a scheduler running on time. Uploaded shop logos are retained by media maintenance.

4. After adding the selected provider, register its server webhook URL, configure merchant credentials and verify the full sandbox checkout flow, then explicitly verify a live payment before claiming live readiness.

## Subscription behavior

- Free: Rs. 0 and five published listings. Shop: Rs. 2,000 in LKR, 100 published listings, and a public shop for 30 days.
- One verified successful order adds exactly 720 hours to the later of current expiry or server confirmation time. No automatic renewal or recurring billing.
- The store and payment-order rows are locked while confirming. Repeated or simultaneous callbacks cannot extend the same order twice. A unique provider transaction reference prevents applying one transaction to different orders. Failed/pending results do not grant a plan; later failed/pending callbacks cannot reverse a successful confirmation.
- Expiry retains the seller's selected published listings first, then the oldest active listings up to five. Other listings pause, retain their data and lose featured placement. The public shop is hidden, while shop information is retained. Renewal does not automatically publish paused inventory.
- Sellers can select up to five listings in subscription settings. On Free, applying that selection pauses unselected active listings and restores selected listings that were paused by plan expiry. Drafts, rejected, archived, sold and manually paused listings cannot bypass moderation through this mechanism.
- A PostgreSQL trigger enforces published-listing limits even under concurrent approvals or direct writes. Existing moderation remains in place; draft and pending listings do not count toward the active allowance.
- Dashboard polling uses server state for pending, successful, failed and expired views. A successful receipt animates into view, inspired by the provided video. Reduced-motion preferences disable that animation.

## Verification

```sh
npm --prefix backend test
npm --prefix backend run test:e2e
npx tsc --noEmit
npm run lint
npm run build -- --webpack
```

The new PostgreSQL suite creates and removes an isolated schema. It covers pending and failed payments, verified success, duplicate concurrent confirmations, mismatched amount/currency, transaction reuse, renewal before/after expiry, 5/100 limits under simultaneous publication, expiry preservation, selected listing swaps, and other-seller/unmoderated listing rejection. These tests do **not** establish provider signature verification or live payment functionality; those require the selected gateway integration.
