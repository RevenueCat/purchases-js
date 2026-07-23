# React Web Billing Demo

### Development

- Install and build dependencies in the root `purchases-js`
  - `pnpm i`
  - `pnpm run build`
- Install dependencies for the webbilling-demo app

  - `pnpm i`

- Set the following env variables. You can set them in a `.env` file in the root of this demo app.

```bash
export VITE_RC_API_KEY = 'your public web billing api key (prefixed with rcb_)'
```

- Start the server

```bash
npm run dev
```

> **NOTE:** In development mode, the SDK connects to `localhost:8000` by default (set in the root `.env.development`). If you want to point the demo at production or a custom backend instead, set the following env vars in your `.env` file in this demo directory:
>
> ```bash
> VITE_RC_PROXY_URL=https://api.revenuecat.com
> VITE_RC_EVENTS_URL=https://e.revenue.cat
> ```
>
> No library rebuild is needed — these are passed via `httpConfig` at runtime.
>
> **Expected behavior:** When using your Web Billing product API key, you should see customers created in Sandbox in your dashboard after completing purchases. View activity at https://app.revenuecat.com/activity after a few minutes to see sandbox transactions and customer data.

### Headless upgrade PoC

The `/upgrade/:app_user_id` page demonstrates the experimental headless product change flow (`Purchases.changeProduct`). It requires the demo token server, a separate process that plays the role of your backend: it holds a **secret** API key and mints short-lived subscriber access tokens via the Developer API `authenticate` endpoint. The secret key is read from a non-`VITE_` env var so it can never be bundled into frontend code.

1. Copy `server/.env.example` to `server/.env` and fill in `RC_SECRET_API_KEY` (a V2 secret key with the `iam:authorization:issue_token` permission), `RC_PROJECT_ID` and `RC_APP_ID`. Point `RC_API_BASE` at your backend if not using production.
2. Start the token server: `npm run token-server` (listens on port 8010; the Vite dev server proxies `/api` to it).
3. Start the demo as usual (`npm run dev`) and open `/upgrade/<app_user_id>` for a customer with an active Web Billing subscription.
4. Pick or type the target product identifier and confirm. A product change path from the current product to the target must be configured in RevenueCat; upgrades apply immediately with proration, downgrades are scheduled for the next renewal.

### Payment Methods

The demo supports both **Web Billing** and **Paddle** payment flows:

- **Web Billing** (default): Uses RevenueCat's built-in Web Billing UI flow. Works with Web Billing API keys.
- **Paddle**: Uses Paddle's checkout overlay. Works with Paddle API keys.

#### Using Paddle

Set your Paddle API key in the environment variable:

```bash
export VITE_RC_API_KEY = 'your paddle api key'
```

The SDK automatically detects Paddle API keys and routes to the Paddle flow. The same `purchases.purchase()` call works for both Web Billing and Paddle.

### E2E Tests

- Set the following env variables. You can set them in a `.env` file in the root of this demo app.

```bash
export VITE_RC_NON_TAX_E2E_API_KEY = 'your e2e tests public api key'
export VITE_RC_TAX_E2E_API_KEY = 'your e2e tests public api key'
export VITE_RC_FULL_ADDRESS_E2E_API_KEY = 'your e2e tests public api key'
export VITE_RC_STRIPE_CHECKOUT_E2E_API_KEY = 'your stripe checkout e2e tests public api key'
export VITE_RC_PADDLE_E2E_API_KEY = 'your paddle e2e tests public api key'
```

Optional flags:

```bash
# Useful if Stripe rate limiting is causing flaky CI runs.
export VITE_SKIP_STRIPE_TESTS=true

# Useful to temporarily disable Paddle tests.
export VITE_SKIP_PADDLE_TESTS=true
```

Install playwright

```bash
npx playwright install --with-deps
```

Headless

```bash
npm run test:e2e
```

With a UI

```bash
npm run test:e2e-ui
```

### Testing Apple Pay and Google Pay with local certs

To test Apple Pay and Google Pay we have to fake an https setup for the Apple Pay/Google Pay authorized domains locally.
The following instructions allow you to do it just using this repo but require you to play with your `/etc/hosts` and won't work on windows.

> [!WARNING]  
> This setup will install local certificates for somedomain.com in your machine using the vite-plugin-mkcert, therefore, you need to run this
> command as superuser. Make sure to pick a domain (or add one) that you don't want to mess up on your machine or you'll
> have to fix your certificates manually.

Check the enabled domains in the Stripe config for the Apple Pay/Google Pay Payment method.
Say the domain `somedomain.com` exists in that list.

Add this line to your `/etc/hosts` file.

```
127.0.0.1 somedomain.com
```

This will resolve `somedomain.com` to localhost.

Now you can run the webserver forcing the usage of that domain and the 443 port (for full https support).

```
sudo npm run dev-fake-https -- --host somedomain.com --port 443
```

Now you should be able to run safari with Apple Pay just by visiting `somedomain.com`.

### Viewing Paywalls

Before a paywall will appear, you need an offering configured in the [RevenueCat dashboard](https://app.revenuecat.com) with packages and a paywall attached.

1. Go to the landing page and click **"Subscribe now"**
2. Enter your app user ID
3. Optionally enter an **offering identifier** to load a specific offering — leave blank to use the default offering
4. Click **"Continue (RC Paywall)"** to view the RC paywall

If you see a blank page or "No offering found!", check that your offering is set as the **default offering** in the dashboard (or that the identifier you entered is correct) and has a paywall configured.
