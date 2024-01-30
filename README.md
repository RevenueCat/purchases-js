<h3 align="center">😻 In-App Subscriptions Made Easy 😻</h3>
<h4 align="center">🕸️ For the web 🕸️</h4>

RevenueCat is a powerful, reliable, and free to use in-app purchase server with cross-platform support.
This repository includes all you need to manage your subscriptions on your website or web app using RevenueCat.

Sign up to [get started for free](https://app.revenuecat.com/signup).

# Prerequisites

Login @ [app.revenuecat.com](https://app.revenuecat.com)

- Create a Project (if you haven't already)

### ======> Only while testing <======

- Add the private project id (a.k.a. app_id) to the following feature flags
  - RCBILLING
  - GENERATE_V2_SUBSCRIPTION_MODELS_FOR_RCBILLING
  - GENERATE_V2_SUBSCRIPTION_MODELS

### ======> Only while testing <======

- Add a new RCBilling app
  - Get the `RC_PUBLISHABLE_API_KEY` (you will need it soon)
  - Connect your Stripe account (More payment gateways are coming soon)
- Create some products for the RCBilling App
- Create an offering and add packages with RCBilling products
- Create the entitlements you need in your app and link them to the RCBilling products

# Installation

### ======> Only during testing <======

- Get a token to download the sdk from our private npm registry
- Set the environment variable `NODE_AUTH_TOKEN`

```bash
export NODE_AUTH_TOKEN="the token you got from the npm registry"
```

### ======> Only during testing <======

- Add the library to your project's dependencies

```
npm add --save @revenuecat/purchases-js
```

# Usage

## Download the current Offerings

By downloading the current Offerings you can easily build a Paywall page using the embedded Packages and their
associated `rcBillingProduct` and price.

```typescript
const appUserId = "the unique id of the user in your systems";
const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");

purchases.getOfferings(appUserId).then((offerings) => {
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
const appUserId = "the unique id of the user in your systems";
const entitlementId = "the entitlementId you set up in RC";

const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");

purchases.getCustomerInfo(appUserId).then((customerInfo) => {
  if (entitlementId in customerInfo.entitlements.active) {
    console.log(`User ${appUserID} is entitled to ${entitlementId}`);
  } else {
    console.log(`User ${appUserID} is not entitled to ${entitlementId}`);
  }
});
```

As example, you can build a cool React component with it:

```tsx
const WithEntitlement = ({ appUserId, entitlementId, children }) => {
  const [isEntitled, setIsEntitled] = useState<boolean | null>(null);

  useEffect(async () => {
    const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");
    const customerInfo = await purchases.getCustomerInfo(appUserId);
    setIsEntitled(entitlementId in customerInfo.entitlements.active);
  }, [appUserId, entitlementId]);

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
    <WithEntitlement appUserId={"user12345"} entitlementId={"functionality5"}>
      <Functionality5 />
    </WithEntitlement>
  </>
);
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
const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");
// You can retrieve the package from the offerings through `getOfferings`:
const rcBillingPackage = offerings.current.packages[0];
const appUserId =
  "the unique id of the user that wants to subscribe to your product";
const entitlementIdToCheck = "the entitlementId you set up in RC for your product"; // TODO: remove once this is not needed

purchase.purchasePackage(appUserId, rcBillingPackage, entitlementIdToCheck).then((response) => {
  const isEntitled = entitlementIdToCheck in response.customerInfo.entitlements.active;
  if (isEntitled == true) {
    console.log(`User ${appUserID} is entitled to ${entitlementId}`);
  } else {
    console.log(
            `User ${appUserID} is not entitled to ${entitlementId}, even after ${numberOfAttempts} attempts`,
    );
  }
});
```

### Important note

Please be aware that the information about the entitlements can be manipulated by malicious actors, so make sure
you protect your apps against attacks that modify the entitlements by validating access through your servers.

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
npm test
```

# Publishing a new version

- Update the version in `package.json`
- Add a new entry in `CHANGELOG.md` including all the PR merged and crediting the authors
- Commit the changes in main
- Create a new tag with the version number and push:

```
git tag v[version_number]
git push origin v[version_number]
```
