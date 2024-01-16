# React RC Billing Demo

### See the deployed version

- Go to [https://d1w982iwrl06qp.cloudfront.net/](https://d1w982iwrl06qp.cloudfront.net/) (credentials in 1password: RCBillingDemo)
- Configure products and offerings in the Audiences Testing Account (credentials in 1password)

### Development

- Install and build dependencies in the root `purchases-js`
  - `npm i`
  - `npm run build`
- Install dependencies for the rcbilling-demo app

  - `npm i`

- Set the following env variables. You can find the defaults in 1Password: `RCBilling Demo ENV Vars`. You can set them in a `.env` file in the root of this demo app.

```bash
export VITE_RC_API_KEY = 'your public api key'
export VITE_RC_STRIPE_ACCOUNT_ID= 'your stripe account id'
export VITE_RC_STRIPE_PK_KEY='your stripe publishable key'
```

- Start the server

```bash
npm run dev
```

# Deploy

Just merge to main/merge PR to main, it will be deployed automatically

# Change RC App

Change the necessary github actions secrets (RC_API_KEY, STRIPE_ACCOUNT_ID/PK_KEY) and trigger manually the deploy action.
