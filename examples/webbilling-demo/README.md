# React Web Billing Demo

### Development

- Install and build dependencies in the root `purchases-js`
  - `npm i`
  - `npm run build`
- Install dependencies for the webbilling-demo app

  - `npm i`

- Set the following env variables. You can set them in a `.env` file in the root of this demo app.

```bash
export VITE_RC_API_KEY = 'your public api key'
```

- Start the server

```bash
npm run dev
```

> **NOTE:** If you encounter connection errors to `localhost:8000` when testing the demo, this is because the demo is running in development mode which tries to connect to a local RevenueCat backend server. To fix this:
>
> 1. **Update the root `.env.development` file** with production endpoints:
>    ```bash
>    VITE_RC_ENDPOINT=https://api.revenuecat.com
>    VITE_RC_ANALYTICS_ENDPOINT=https://e.revenue.cat
>    ```
> 2. **Rebuild the main purchases-js library** (from the root directory):
>    ```bash
>    npm run build
>    ```
> 3. **Restart the demo** (from this directory):
>    ```bash
>    npm run dev
>    ```
>
> **Expected behavior:** When using your Web Billing product API key, you should see customers created in Sandbox in your dashboard after completing purchases. View activity at https://app.revenuecat.com/activity after a few minutes to see sandbox transactions and customer data.

### E2E Tests

- Set the following env variables. You can set them in a `.env` file in the root of this demo app.

```bash
export VITE_RC_NON_TAX_E2E_API_KEY = 'your e2e tests public api key'
export VITE_RC_TAX_E2E_API_KEY = 'your e2e tests public api key'
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

### Configuring PayPal

The demo renders a PayPal button whenever the RevenueCat checkout flow returns PayPal settings. Set the VITE_RC_API_KEY to an app that has the PayPal payment method enabled for its Web Billing app. For the PayPal button to appear, the checkout start response must contain a `gateway_params.paypal_configuration` object with:

- The PayPal **client_access_token** - a client-side JWT access token.
- The target **currency**.

If the configuration is absent the PayPal button stays hidden while the Stripe checkout remain available.

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
