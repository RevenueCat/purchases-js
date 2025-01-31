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

### E2E Tests

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
