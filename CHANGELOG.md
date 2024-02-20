# 0.0.16
- Rename getInstance to getSharedInstance and initializePurchases to configure (#69)

# 0.0.15
- Move the SDK to a singleton pattern with initializer method (#67)

# 0.0.14
- Rename package timed accessors to match other SDKs (#65)

# 0.0.13
- Add `availablePackages` to `Offering` type (#63)
- Add api-extractor and api-documenter (#61)
- Add docs for public API (#60)
- Small magic form improvements (#59)

# 0.0.12
- Update README with latest API changes (#47)
- Use Stripe params from the server instead of env variables (#57)
- Use getCustomerInfo internally in isEntitledTo API (#56)
- Handle errors in magic form (#55)
- Change to use /operation endpoint to poll for purchase status (#53)
- Type check tests in CI (#51)
- Consume branding info endpoint from Purchases.js (#52)
- Add svelte-check to check for errors in svelte files (#54)
- Add most missing `CustomerInfo` properties (#50)
- Add `presentedOfferingIdentifier` to Product type (#49)
- Improve offering types (#48)
- Add `X-Is-Sandbox` header to all requests (#45)
- Handle networking errors (#43)
- Add networking layer (#41)
- Improve `purchasePackage` API to return errors as exceptions (#40)

# 0.0.11
- Added support to sandbox api keys
- Removed the environment parameter

# 0.0.10

- Embedded UI (#24)
- Move rcbilling-demo to purchases-js (#32)
- Rename listOfferings to getOfferings, OfferingsPage to Offerings and remove getPackage (#34)
- Add puppeteer to execute E2E tests of purchasing flow (#33)
- Hide offerings with no found products (#31)

# 0.0.9

- Add `current` to offerings in #26
- Add log for missing product ids when getting offerings in #29
- Remove `pricePerPackageId` field from offerins in #27
- Make `all` field in offerings a dictionary in #28

# 0.0.3

- Add prettier by @francocorreasosa in #13
- Bug: fix some types by @alfondotnet in #14

# 0.0.2

- Fix publishing to NPM by @alfondotnet in # 10
- BIL-40: Add subscribe method by @francocorreasosa in #11
- Only build ES modules by @alfondotnet in #12

# 0.0.1

Initial release 🐱🚀

- Add Vite by @alfondotnet in #1
- add README by @alfondotnet in #2
- Fon/add entrypoint by @alfondotnet in #3
- Simplify existing methods + MSW by @alfondotnet in #5
- Added the listOfferings method by @nicfix in #4
- Migrated to the new price naming by @nicfix in #6
- BIL-15: isEntitledTo method! by @nicfix in #7
- Rename / Clean up package prior to publishing to NPM by @alfondotnet in #9
