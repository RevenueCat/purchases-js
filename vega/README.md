<h3 align="center">😻 In-App Subscriptions Made Easy 😻</h3>
<h4 align="center">For the Amazon App Store on the Vega OS</h4>

RevenueCat is a powerful, reliable, and free to use in-app purchase server with cross-platform support.
This repository includes all you need to manage your subscriptions on the Amazon App Store on the Vega OS using RevenueCat.

Looking for support for the Amazon App Store on Android? See [purchases-android](https://github.com/revenuecat/purchases-android).

Sign up to [get started for free](https://app.revenuecat.com/signup).

## Beta Support

Support for the Amazon App Store on Vega OS is currently in public beta. Please note that API changes may occur unexpectedly without notice during the beta period.

# Prerequisites

Login @ [app.revenuecat.com](https://app.revenuecat.com)

- Create your Amazon account if you haven't already
- Create a Project (if you haven't already)
- Add a new Amazon app in the RevenueCat Dashboard
- Get the API key (it will start with `amzn_`)
- Create some products for the Amazon App
- Create an offering and add packages with Amazon products
- Create the entitlements you need in your app and link them to the Amazon products

# Installation

- Add the library to your project's dependencies
  - npm
    ```
    npm install --save @revenuecat/purchases-js-vega
    ```
  - yarn
    ```
    yarn add --save @revenuecat/purchases-js-vega
    ```

# Usage

Usage instructions are coming soon to the [RevenueCat Docs](https://www.revenuecat.com/docs/).

## Update API specs

```bash
pnpm run extract-api
```

This will update the files in `api-report` and `vega/api-report` with the latest public API for both packages.
If it has uncommitted changes, CI tests will fail. Run this command and commit the changes if
they are expected.

# Publishing a new version

New versions are automated weekly, but you can also trigger a new release through CircleCI or locally
following these steps:

- Run `bundle exec fastlane bump` and follow the instructions
- A PR should be created with the changes and a hold job in CircleCI.
- Approve the hold job once tests pass. This will create a tag and continue the release in CircleCI
- Merge the PR once it's been released
