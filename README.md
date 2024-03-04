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

```
npm add --save @revenuecat/purchases-js
```

# Usage

## Download the current Offerings

By downloading the current Offerings you can easily build a Paywall page using the embedded Packages and their
associated `rcBillingProduct` and price.

```typescript
const purchases = Purchases.configure(
  "your RC_PUBLISHABLE_API_KEY",
  "the unique id of the user in your systems",
);

purchases.getOfferings().then((offerings) => {
  // Get current offering
  console.log(offerings.current);
  // Or a dictionary of all offerings
  console.log(offerings.all);
});
```

This should print the current offerings you have set up in your RC Account.

Please check out [this file](https://github.com/RevenueCat/purchases-js/blob/main/src/entities/offerings.ts) for the
Offering's data structure

## Check User Entitlements

You can check the entitlements granted to your users throughout all the platforms, now
also on your website!

```typescript
const entitlementId = "the entitlementId you set up in RC";

const purchases = Purchases.configure(
  "your RC_PUBLISHABLE_API_KEY",
  "the unique id of the user in your systems",
);
const appUserID = purchases.getAppUserId();

purchases.isEntitledTo(entitlementId).then((isEntitled) => {
  if (isEntitled == true) {
    console.log(`User ${appUserID} is entitled to ${entitlementId}`);
  } else {
    console.log(`User ${appUserID} is not entitled to ${entitlementId}`);
  }
});
```

As example, you can build a cool React component with it:

```tsx
Purchases.configure(
  "your RC_PUBLISHABLE_API_KEY",
  "the unique id of the user in your systems",
);

const WithEntitlement = ({ entitlementId, children }) => {
  const [isEntitled, setIsEntitled] = useState<boolean | null>(null);

  useEffect(() => {
    Purchases.getSharedInstance()
      .isEntitledTo(entitlementId)
      .then((isEntitled) => {
        setIsEntitled(isEntitled);
      });
  }, [entitlementId]);

  if (isEntitled === null) {
    return <>"loading..."</>;
  }

  if (isEntitled === true) {
    return <>{children}</>;
  }

  return <>You are not entitled!</>;
};
```

And then use it in your app:

```tsx
const App = () => (
  <>
    <WithEntitlement entitlementId={"functionality5"}>
      <Functionality5 />
    </WithEntitlement>
  </>
);
```

If you need further information about the user's entitlements, you can use the `getCustomerInfo` method:

```ts
const customerInfo = await purchases.getCustomerInfo();
```

### Important note

Please be aware that the information about the entitlements can be manipulated by malicious actors, so make sure
you protect your apps against attacks that modify the entitlements by validating access through your servers.

## Subscribe a User to an entitlement and allow payment with Stripe

RCBilling allows you to use your payment gateway for payments.
In this example we will show Stripe, more will be supported soon!

### Context

You built your paywall, and your user just clicked on the offer they want to subscribe to.

```tsx
const purchases = Purchases.configure(
  "your RC_PUBLISHABLE_API_KEY",
  "the unique id of the user in your systems",
);
// You can retrieve the package from the offerings through `getOfferings`:
const rcBillingPackage = offerings.current.availablePackages[0];
const appUserId = purchases.getAppUserId();
const entitlementIdToCheck =
  "the entitlementId you set up in RC for your product"; // TODO: remove once this is not needed

purchase.purchasePackage(rcBillingPackage).then((response) => {
  const isEntitled =
    entitlementIdToCheck in response.customerInfo.entitlements.active;
  if (isEntitled == true) {
    console.log(`User ${appUserID} is entitled to ${entitlementId}`);
  } else {
    console.log(
      `User ${appUserID} is not entitled to ${entitlementId}, even after ${numberOfAttempts} attempts`,
    );
  }
});
```

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
npm i /path/to/rcbilling-js
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

```bash
npm run build
cd examples/rcbilling-demo
npm run build
# In a different terminal or background the process
npm run dev
npm run test
```

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
