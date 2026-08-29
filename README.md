# Stagr

DJ-Booking-Marktplatz (SvelteKit 5 + Convex + Clerk). Web-first, dieselbe Codebase in iOS/Android über Capacitor.

## Setup

1. Env-Datei anlegen:

```sh
cp .env.example .env.local
```

2. Convex einrichten (Login im Terminal, nicht `convex deploy` für Dev):

```sh
npx convex dev
```

Trage `PUBLIC_CONVEX_URL` und `CONVEX_DEPLOYMENT` ein. Clerk braucht ein JWT-Template namens **`convex`** und `CLERK_JWT_ISSUER_DOMAIN`.

3. Web-App:

```sh
npm run dev
```

4. Native Hülle (nach Web-Deploy `PUBLIC_APP_URL` setzen):

```sh
npx cap sync
npx cap open ios
npx cap open android
```

Deep Links: `stagr://app/bookings/<id>`. Push-Tokens landen in Convex; Versand braucht optional `FCM_SERVER_KEY`.

## Clerk / Apple

Im Clerk-Dashboard Google und **Sign in with Apple** aktivieren (für den iOS-Store Pflicht, sobald Social Login existiert).

## Stripe Connect

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` und die Convex-HTTP-Route `/stripe-webhook`. Destination Charges: Anzahlung 30 %, Rest 70 %, Platform-Fee über `PLATFORM_FEE_PERCENT`.
