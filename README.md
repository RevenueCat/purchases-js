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
yarn install
yarn run build:dev
```

To avoid publishing the package you can set it up as a local dependency.
In your testing project install the library as.

```bash
yarn i /path/to/rcbilling-js
```

## Running tests

```bash
yarn run test
```

## Running linters

```bash
yarn run test:typeCheck
yarn run svelte-check
yarn run prettier
yarn run lint
```

## Running E2E tests

```bash
yarn run build
cd examples/rcbilling-demo
yarn run build
# In a different terminal or background the process
yarn run dev
yarn run test
```

## Update API specs

```bash
yarn run extract-api
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
