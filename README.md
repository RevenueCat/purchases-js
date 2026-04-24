<h3 align="center">😻 In-App Subscriptions Made Easy 😻</h3>
<h4 align="center">🕸️ For the web 🕸️</h4>

RevenueCat is a powerful, reliable, and free to use in-app purchase server with cross-platform support.
This repository includes all you need to manage your subscriptions on your website or web app using RevenueCat.

Sign up to [get started for free](https://app.revenuecat.com/signup).

# Prerequisites

Login @ [app.revenuecat.com](https://app.revenuecat.com)

- Connect your Stripe account if you haven't already (More payment gateways are coming soon)
- Create a Project (if you haven't already)
- Add a new Web Billing app
- Get the sandbox API key or production API key (depending on the environment)
- Create some products for the Web Billing App
- Create an offering and add packages with Web Billing products
- Create the entitlements you need in your app and link them to the Web Billing products

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

See the [RevenueCat docs](https://www.revenuecat.com/docs/web/web-billing) and the [SDK Reference](https://revenuecat.github.io/purchases-js-docs).

# Development

## Install the library in a local project

- Clone the repository
- Install dependencies
- Build the library

```bash
pnpm install
pnpm run build:dev
```

To avoid publishing the package you can use pnpm's link feature:

1. In the purchases-js directory, register the package:

```bash
pnpm link
```

2. In your testing project, link to the registered package:

```bash
pnpm link "@revenuecat/purchases-js"
```

> **Note:** Any changes you make to the library will be automatically reflected in your testing project after running `pnpm run build:dev` or `pnpm run build`.

### Using a local `@revenuecat/purchases-ui-js`

When you need to iterate on both `purchases-js` and `purchases-ui-js` together, you can point this repo at a sibling checkout using a `pnpm-workspace.yaml` override (instead of manually editing `package.json`).

1. Place the two repos side by side, for example:

```
Developer/
  purchases-js/
  purchases-ui-js/
```

2. In `purchases-js`, create or edit `pnpm-workspace.yaml` and add:

```yaml
overrides:
  "@revenuecat/purchases-ui-js": "link:../purchases-ui-js"
```

Use the **scoped** package name (`@revenuecat/purchases-ui-js`). A key like `purchases-ui-js` will not apply the override.

3. Reinstall dependencies from the `purchases-js` root:

```bash
pnpm install
```

4. Verify the override resolved:

```bash
pnpm why @revenuecat/purchases-ui-js
```

You should see `link:../purchases-ui-js`.

5. Build the UI package when you change it (from `purchases-ui-js`), then rebuild or run dev builds in `purchases-js` as needed.

#### Reverting

Remove the override from `pnpm-workspace.yaml` and run `pnpm install` again to return to the published `@revenuecat/purchases-ui-js` version.

## Running Storybook

```bash
pnpm run storybook
```

### Environment Setup for Purchase Stories

> **Note:** This setup is only required if you need to test Storybook stories involving the `payment-entry` page.

To run these specific stories, you'll need to set up some environment variables. There are two options:

### Option 1: Internal Teams

Internal team members can find the required environment variables in 1Password.

### Option 2: Setup Manually

1. Create a test account in Stripe
2. Create a `.env.development.local` file and set the following variables:

```bash
VITE_STORYBOOK_PUBLISHABLE_API_KEY="pk_test_1234567890"
VITE_STORYBOOK_ACCOUNT_ID="acct_1234567890"
```

## Running tests

```bash
pnpm run test
```

## Running linters

```bash
pnpm run test:typecheck
pnpm run svelte-check
pnpm run prettier
pnpm run lint
```

## Running E2E tests

Please check the Demo app readme [here](./examples/webbilling-demo/README.md#e2e-tests)

## Update API specs

```bash
pnpm run extract-api
```

This will update the files in `api-report` with the latest public API.
If it has uncommitted changes, CI tests will fail. Run this command and commit the changes if
they are expected.

# Publishing a new version

New versions are automated weekly, but you can also trigger a new release through CircleCI or locally
following these steps:

- Run `bundle exec fastlane bump` and follow the instructions
- A PR should be created with the changes and a hold job in CircleCI.
- Approve the hold job once tests pass. This will create a tag and continue the release in CircleCI
- Merge the PR once it's been released
