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
const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");

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
const appUserId = "the unique id of the user in your systems";
const entitlementId = "the entitlementId you set up in RC";

const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");

purchases.isEntitledTo(appUserId, entitlementId).then((isEntitled) => {
  if (isEntitled == true) {
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

  useEffect(() => {
    const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");
    purchases.isEntitledTo(appUserId, entitlementId).then((isEntitled) => {
      setIsEntitled(isEntitled);
    });
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

## Subscribe a User to an entitlement and allow payment with Stripe

RCBilling allows you to use your payment gateway for payments.
In this example we will show Stripe, more will be supported soon!

### Context

You built your paywall, and your user just clicked on the offer they want to subscribe to.

### 1. Call the .subscribe method to initialise the process

```tsx
const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");
// You can retrieve this from the offerings you downloaded, as example:
// offerings.current.packages[0].rcBillingProduct.identifier
const rcBillingProductIndentifier =
  "the Product Identifier the user wants to buy";
const appUserId =
  "the unique id of the user that wants to subscribe to your product";

purchase.subscribe(appUserId, rcBillingProductIndentifier).then((response) => {
  if (response.nextAction === "collect_payment_info") {
    // Use the clientSecret to show the StripeElements payment components
    showStripeElements({
      setupIntentClientSecret: response.data.clientSecret,
    });
  } else {
    // No need to collect payment info, just wait for the entitlement to be granted
  }
});
```

### 2. [If nextAction === 'collect_payment_info'] Show the Stripe Elements to collect payment

```tsx
// Set up stripe as shown in their docs
const stripePromise = loadStripe(
  import.meta.env.VITE_RC_STRIPE_PK_KEY as string,
  { stripeAccount: import.meta.env.VITE_RC_STRIPE_ACCOUNT_ID as string },
);

// Use the clientSecret obtained in the step 1. Call the .subscribe method to initialise the process
const PaymentForm = ({ clientSecret }) => {
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    stripe
      .confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: "if_required",
      })
      .then((response) => {
        // All is done you can now wait for the entitlement to be granted.
      });
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
    </form>
  );
};
```

### 3. Wait for the entitlement to be granted

You can use the `.waitForEntitlement` method.

```tsx
const appUserId = "the unique id of the user in your systems";
const entitlementId = "the entitlementId you set up in RC";

const purchases = new Purchases("your RC_PUBLISHABLE_API_KEY");
const numberOfAttempts = 10;

purchases
  .waitForEntitlement(appUserId, entitlementId, numberOfAttempts)
  .then((isEntitled) => {
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
