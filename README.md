<h3 align="center">😻 In-App Subscriptions Made Easy 😻</h3>
<h4 align="center">🕸️ For the web 🕸️</h4>

RevenueCat is a powerful, reliable, and free to use in-app purchase server with cross-platform support.
This repository includes all you need to manage your subscriptions on your website or web app using RevenueCat.

Sign up to [get started for free](https://app.revenuecat.com/signup).

# Prerequisites

Login @ [app.revenuecat.com](https://app.revenuecat.com)

- Connect your Stripe account if you haven't already (More payment gateways are coming soon)
- Create a Project (if you haven't already)
- Add a new RCBilling app
- Get the sandbox API key or production API key (depending on the environment)
- Create some products for the RCBilling App
- Create an offering and add packages with RCBilling products
- Create the entitlements you need in your app and link them to the RCBilling products

# Installation

- Add the library to your project's dependencies
  - npm
    ```
    npm install --save @revenuecat/purchases-js
    ```
  - yarn
    ```
    yarn add --save @revenuecat/purchases-js
    ```

# Usage

See the [RevenueCat docs](https://www.revenuecat.com/docs/web/revenuecat-billing) and the [SDK Reference](https://revenuecat.github.io/purchases-js-docs).

# Development

## Install the library in a local project

- Clone the repository
- Install dependencies
- Build the library

```bash
npm install
npm run build:dev
```

To avoid publishing the package you can set it up as a local dependency.
In your testing project install the library as.

```bash
npm i /path/to/purchases-js
```

## Running Storybook

```bash
npm run storybook
```

### Environment Setup for Payment Info Stories

> **Note:** This setup is only required if you need to test Storybook stories involving the `state-needs-payment-info` component.

To run these specific stories, you'll need to set up some environment variables. There are two options:

### Option 1: Internal Teams

Internal team members can find the required environment variables in 1Password.

### Option 2: Manual Setup

1. Inspect a purchase through RCBilling and get the following values from the `/purchase` response:

```json
{
  "data": {
    "client_secret": "client_secret",
    "publishable_api_key": "api_key",
    "stripe_account_id": "account_id"
  },
  "next_action": "collect_payment_info",
  "operation_session_id": "rcbopsess_test_test_test"
}
```

2. Create a `.env.development.local` file and set the following variables:

```bash
VITE_STORYBOOK_SETUP_INTENT="client_secret"
VITE_STORYBOOK_PUBLISHABLE_API_KEY="api_key"
VITE_STORYBOOK_ACCOUNT_ID="account_id"
```

## Running tests

```bash
npm run test
```

## Running linters

```bash
npm run test:typeCheck
npm run svelte-check
npm run prettier
npm run lint
```

## Running E2E tests

Please check the Demo app readme [here](./examples/rcbilling-demo/README.md#e2e-tests)

## Update API specs

```bash
npm run extract-api
```

This will update the files in `api-report` with the latest public API.
If it has uncommited changes, CI tests will fail. Run this command and commit the changes if
they are expected.

# Publishing a new version

New versions are automated weekly, but you can also trigger a new release through CircleCI or locally
following these steps:

- Run `bundle exec fastlane bump` and follow the instructions
- A PR should be created with the changes and a hold job in CircleCI.
- Approve the hold job once tests pass. This will create a tag and continue the release in CircleCI
- Merge the PR once it's been released
