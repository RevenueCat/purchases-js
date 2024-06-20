## 0.3.1
### Dependency Updates
* Bump braces from 3.0.2 to 3.0.3 in /examples/rcbilling-demo (#127) via dependabot[bot] (@dependabot[bot])
* Bump ws and puppeteer in /examples/rcbilling-demo (#128) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Make demo app independent of entitlement ID (#126) via Jens-Fabian Goetzmann (@jefago)
* Small demo app changes (#125) via Jens-Fabian Goetzmann (@jefago)
* Add new `OfferNotFound` error parsing to backend request error processing (#124) via Toni Rico (@tonidero)
* Add processed `period` to `PricingPhase` (#123) via Toni Rico (@tonidero)
* Update vite dependency in RCBilling demo app (#120) via Toni Rico (@tonidero)

## 0.3.0
### New Features
* Add `title` and `description` to Product (#121) via Toni Rico (@tonidero)
* Trial support (#117) via Nicola Sacco (@nicfix)
### Dependency Updates
* Bump rexml from 3.2.6 to 3.2.8 (#114) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Added support for SubscriptionPurchaseOptions in ProductResponses (#113) via Nicola Sacco (@nicfix)
* Allow multiple configure calls to create new purchases (#112) via Toni Rico (@tonidero)
* Redesigned demo app (#111) via Jens-Fabian Goetzmann (@jefago)

## 0.2.2
### Dependency Updates
* Bump ejs from 3.1.9 to 3.1.10 (#109) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Only update docs index on latest stable releases (#107) via Toni Rico (@tonidero)

## 0.2.1
### Dependency Updates
* Bump vite from 5.2.2 to 5.2.6 (#106) via dependabot[bot] (@dependabot[bot])
* Bump express from 4.19.1 to 4.19.2 (#105) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Improve API key validation (#104) via Toni Rico (@tonidero)

## 0.2.0
### New Features
* [BIL-292] Add `formattedPrice` to Price (#102) via Toni Rico (@tonidero)

## 0.1.3
### Other Changes
* Improve package.json with some useful info to be populated in npmjs (#99) via Toni Rico (@tonidero)
* Update dependencies to latest versions (#100) via Toni Rico (@tonidero)
* Handle network errors (#98) via Toni Rico (@tonidero)

## 0.1.2
### Bugfixes
* Fix CustomerInfo parsing and add support to non subscription parsing (#95) via Toni Rico (@tonidero)

## 0.1.1
### Bugfixes
* Jfg fix responsive design (#93) via Jens-Fabian Goetzmann (@jefago)

## 0.1.0
### New Features
* Responsive UI for purchase flow (#85) via Jens-Fabian Goetzmann (@jefago)
### Bugfixes
* Removed the .npmrc now that the demo app builds from the relative path (#89) via Nicola Sacco (@nicfix)
* URL encode user defined parameters in urls (#82) via Toni Rico (@tonidero)
### Other Changes
* Responsive UI polish (#91) via Jens-Fabian Goetzmann (@jefago)
* Rename `.npmrc` to `.npmrc.SAMPLE` and only rename back for publishing CI job (#90) via Toni Rico (@tonidero)
* Replaced image with another one (#88) via Nicola Sacco (@nicfix)
* Stick with npm and update readmes (#87) via Jens-Fabian Goetzmann (@jefago)
* Send `presented_offering_identifier` in `POST /subscribe` (#84) via Toni Rico (@tonidero)
* Verify API key and user id are valid during configuration (#83) via Toni Rico (@tonidero)
* Fix version auto-bump automation (#81) via Toni Rico (@tonidero)
* Improve README in preparation of making SDK public (#80) via Toni Rico (@tonidero)
* Separate API keys for E2E tests and demo (#79) via Toni Rico (@tonidero)
* Deploy demo page CircleCI (#78) via Toni Rico (@tonidero)

## 0.0.18
### Bugfixes
* Fix deployment of library after moving to CircleCI (#76) via Toni Rico (@tonidero)

## 0.0.17
### New Features
* Add `Logger` class and `setLogLevel` method to control what logs are printed to console. (#72) via Toni Rico (@tonidero)
* Add close button in email input screen (#73) via Toni Rico (@tonidero)
### Bugfixes
* Support multiple period durations (#74) via Toni Rico (@tonidero)
### Other Changes
* Add Fastlane + CircleCI for automation and move docs out of SDK repo into dedicated repo. (#70) via Toni Rico (@tonidero)

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
