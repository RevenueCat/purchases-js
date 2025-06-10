## 1.5.3
## RevenueCat SDK
### 🐞 Bugfixes
* Fixed an issue with Apple Pay when the passed date can get outdated between calculation and click (#524) via Nicola Sacco (@nicfix)

## 1.5.2
## RevenueCat SDK
### 🐞 Bugfixes
* Fix customElements not defined error (#522) via James O'Donnell (@james-od)

## 1.5.1
## RevenueCat SDK
### 🐞 Bugfixes
* Added the customization of the stripe checkout element given a subscription option product (#519) via Nicola Sacco (@nicfix)

## 1.5.0
## RevenueCat SDK
### ✨ New Features
* Add `paddle` store (#516) via Will Taylor (@fire-at-will)
### 🐞 Bugfixes
* WEB-2643: Do not show recurrent payment message for one-time purchases (#514) via Nicola Sacco (@nicfix)
* @gezquinndesign: fix: save and apply original inline styles on close (#484) (#505) via Alfonso Embid-Desmet (@alfondotnet)

### 🔄 Other Changes
* Fire CheckoutPaymentFormImpression event only when stripe loaded (#515) via Pol Miro (@polmiro)
* Re-enable tax calculation e2e tests (#507) via Pol Miro (@polmiro)
* Skip running tax calculation tests based on date (#508) via Pol Miro (@polmiro)
* [WEB-2510] Pass brandingAppearance to Buttons (#461) via James O'Donnell (@james-od)
* Allow for Canary testing with ENV vars. (#512) via Nicola Sacco (@nicfix)
* Mock taxes endpoint when rate limited (v2) (#513) via Pol Miro (@polmiro)

## 1.4.3
### 🔄 Other Changes
* [PSP-189] Allow Paddle Api key on validation (#509) via Roger Solé (@rogersole)

## 1.4.2
## RevenueCat SDK
### 🐞 Bugfixes
* only load Stripe when calling .purchase() (#494) via Alfonso Embid-Desmet (@alfondotnet)

### 🔄 Other Changes
* Add tracking for tax calculations (#506) via Pol Miro (@polmiro)
* Fix concurrent call in `StrictMode` (#503) via Antonio Borrero Granell (@antoniobg)
* [WEB-2563] Improve robustness on integration tests (#502) via Pol Miro (@polmiro)
* Fix e2e test app user ID generation (#501) via Antonio Borrero Granell (@antoniobg)

## 1.4.1
## RevenueCat SDK
### 🐞 Bugfixes
* Fix tax calculation mistakenly launched (#499) via Pol Miro (@polmiro)

## 1.4.0
## RevenueCat SDK
### ✨ New Features
* [WEBF-4] Support subscriber attributes (#416) via Antonio Borrero Granell (@antoniobg)
### 🐞 Bugfixes
* Fix flickering button when taxes are being refreshed (#492) via Pol Miro (@polmiro)

## RevenueCatUI SDK
### 🐞 Bugfixes
* Design changes for Already Subscribed/Already Purchased (#478) via James O'Donnell (@james-od)

### 🔄 Other Changes
* Remove pending reason (#496) via Pol Miro (@polmiro)
* [WEB-2475] Better errors for Stripe setup on sandbox (#490) via Pol Miro (@polmiro)
* Fix flakey Email Deliverability test (#495) via James O'Donnell (@james-od)
* chore: add asserts for configure (#493) via Alfonso Embid-Desmet (@alfondotnet)

## 1.3.0
## RevenueCat SDK
### ✨ New Features
* feat: Tax support (private beta) (#489) via Víctor Ferrer García (@vicfergar)
* Increase top padding in mobile + Fix sandbox Close button (#477) via Alfonso Embid-Desmet (@alfondotnet)
* Support branded fonts in typography (#476) via Elena Pérez Rioja (@elenaperezrioja)
* Render wordmark when possible (#472) via Alfonso Embid-Desmet (@alfondotnet)
* Exposed the possibility of customizing the labels as internal parameter (#471) via Nicola Sacco (@nicfix)
* feat: Add support to Stripe Express checkout (#467) via Víctor Ferrer García (@vicfergar)
### 🐞 Bugfixes
* Fixed modal errors appearing below the form on mobile (#464) via Nicola Sacco (@nicfix)

### 🔄 Other Changes
* [WEB-2475] Refactors on error handling (#487) via Pol Miro (@polmiro)
* Adjust chromatic modes (#488) via Pol Miro (@polmiro)
* [WEB-2451] Simplify Tax Calculation Error Handling (#462) via Víctor Ferrer García (@vicfergar)
* Remove unused stripe styles (#486) via Pol Miro (@polmiro)
* Hide back button when coming from app (#475) via Pol Miro (@polmiro)
* Track rcSource (#474) via Pol Miro (@polmiro)
* Fix loading spinner positional glitch (#470) via Pol Miro (@polmiro)
* Remove unneeded payment-entry-processing enum value (#465) via Pol Miro (@polmiro)
* Bump fastlane from 2.227.1 to 2.227.2 (#468) via dependabot[bot] (@dependabot[bot])
* Bump nokogiri from 1.18.4 to 1.18.8 (#452) via dependabot[bot] (@dependabot[bot])
* Bump react-router and react-router-dom in /examples/webbilling-demo (#460) via dependabot[bot] (@dependabot[bot])

## 1.2.1
## RevenueCat SDK
### 📦 Dependency Updates
* [WEB-2480] Button to component lib (#453) via James O'Donnell (@james-od)

### 🔄 Other Changes
* Explicit align of header (#457) via Pol Miro (@polmiro)
* [WEB-2436] Update header and fix spacing (#451) via Pol Miro (@polmiro)
* A few minor text style fixes (#454) via Pol Miro (@polmiro)
* [WEB-2424] Trigger a tax calculation upon payment submission (#450) via Víctor Ferrer García (@vicfergar)
* refactor: Simplify Stripe integration and improve error handling (#444) via Víctor Ferrer García (@vicfergar)
* [WEB-2430] Update font sizes (#449) via Pol Miro (@polmiro)
* [WEB-2450] Add PayButton with Wallet (#446) via Pol Miro (@polmiro)
* Add stories for BrandingInfo (#448) via Pol Miro (@polmiro)

## 1.2.0
## RevenueCat SDK
### ✨ New Features
* Remove email step (#421) via Pol Miro (@polmiro)

### 🔄 Other Changes
* Add `isAnonymous` API (#445) via Toni Rico (@tonidero)
* Runes mode on a couple components (#442) via Pol Miro (@polmiro)
* Add an env var for non tax test api key (#443) via Pol Miro (@polmiro)
* Improvement integration testing (#441) via Pol Miro (@polmiro)
* Bump vite from 6.2.2 to 6.2.6 (#440) via dependabot[bot] (@dependabot[bot])
* Overhaul refactor integration tests (#437) via Pol Miro (@polmiro)
* WEB-2370 - part 1: Refactored the Stripe Payment Elements component to isolate the Payment Elements part (#432) via Nicola Sacco (@nicfix)
* chore: isolate tax calculation e2e tests (#439) via Víctor Ferrer García (@vicfergar)
* [WEB-2398] Do not present taxes to customers in `not_collecting` jurisdictions (FF) (#433) via Víctor Ferrer García (@vicfergar)
* Disable tax calculation E2E tests based on env var in CircleCI (#438) via Nicola Sacco (@nicfix)
* WEB-2370: Added E2E tests for the tax calculation behaviour (#436) via Nicola Sacco (@nicfix)

## 1.1.0
## RevenueCat SDK
### ✨ New Features
* Add pricePerWeek/pricePerMonth/pricePerYear APIs to PricingPhase (#428) via Toni Rico (@tonidero)
* Add new APIs to CustomerInfo to match our mobile SDKs (#426) via Toni Rico (@tonidero)
### 🐞 Bugfixes
* Fix PeriodUnit enum not being exported correctly (#429) via Toni Rico (@tonidero)

### 🔄 Other Changes
* Bump fastlane from 2.227.0 to 2.227.1 (#434) via dependabot[bot] (@dependabot[bot])
* Update esbuild, vite and vitest in example app to solve security vulnerabilities (#431) via Toni Rico (@tonidero)
* Bump esbuild and vitest (#430) via dependabot[bot] (@dependabot[bot])
* Bump esbuild and vite (#388) via dependabot[bot] (@dependabot[bot])
* [WEB-2367] Handle tax calculation errors (FF) (#425) via Víctor Ferrer García (@vicfergar)
* Adds ability to set PlatformInfo info used by hybrids integrating the JS SDK (#424) via Toni Rico (@tonidero)

## 1.0.6
## RevenueCat SDK
### 🐞 Bugfixes
* fix: strip out query parameters from pageUrl (#419) via Pol Miro (@polmiro)

### 🔄 Other Changes
* [WEB-2353] Improve PricingTable style (#418) via Pol Miro (@polmiro)
* Use rectangle for fantastic cat branding (#420) via Pol Miro (@polmiro)
* Bump nokogiri from 1.18.3 to 1.18.4 (#408) via dependabot[bot] (@dependabot[bot])
* fix: Handled submission errors not displayed when tax collection is enabled (FF) (#417) via Víctor Ferrer García (@vicfergar)
* [WEB-2013] Recalculate taxes during checkout (FF) (#413) via Víctor Ferrer García (@vicfergar)
* [WEB-2287] Represent tax breakdown within the pricing details (FF) (#411) via Víctor Ferrer García (@vicfergar)
* chore: Put tax calculations behind the `ALLOW_TAX_CALCULATION_FF` feature flag (#414) via Víctor Ferrer García (@vicfergar)
* Update story fixtures (#412) via Pol Miro (@polmiro)
* chore: Rename calculate tax endpoint (#410) via Víctor Ferrer García (@vicfergar)
* Rearrange state components into pages (#406) via Pol Miro (@polmiro)
* Extract needs payment info components (#402) via Pol Miro (@polmiro)
* [WEB-2013] Trigger initial tax calculation (FF) (#409) via Víctor Ferrer García (@vicfergar)
* Refactor `PurchasesUIInner` (#405) via Pol Miro (@polmiro)
* [WEB-2287] Add component ProductInfoWithTaxSupport (#401) via Pol Miro (@polmiro)
* Change fixture values for stories (#407) via Pol Miro (@polmiro)
* [WEB-2287] Add PricingTable (#400) via Pol Miro (@polmiro)
* [WEB-2287] Add PricingDropdown (#399) via Pol Miro (@polmiro)
* Extract StripePaymentElements (#404) via Pol Miro (@polmiro)
* Fix broken fixture (#403) via Pol Miro (@polmiro)
* Atomic design UI (#398) via Pol Miro (@polmiro)
* Organize stories per atomic design (#397) via Pol Miro (@polmiro)

## 1.0.5
## RevenueCat SDK
### 🐞 Bugfixes
* fix: non subscription double description (#395) via Pol Miro (@polmiro)
* Validate app user id on change (#368) via Pol Miro (@polmiro)
* fix: improve anonymous AppUserID generation compatibility for mobile browsers (#390) via Víctor Ferrer García (@vicfergar)

### 🔄 Other Changes
* Chromatic Diff Threshold (#392) via Pol Miro (@polmiro)
* Improve development setup (#393) via Nihal Gonsalves (@nihalgonsalves)
* Reorganize components (#389) via Pol Miro (@polmiro)
* Freeze storybook date (#391) via Pol Miro (@polmiro)
* Bump fastlane from 2.226.0 to 2.227.0 (#385) via dependabot[bot] (@dependabot[bot])
* Extract pricing components and stories (#380) via Pol Miro (@polmiro)
* Add support for pseudo-states on the storybook toolbar (#379) via Pol Miro (@polmiro)

## 1.0.4
## RevenueCat SDK
### 🐞 Bugfixes
* Fix tracking selected_payment_method (#386) via Pol Miro (@polmiro)

## 1.0.3
## RevenueCat SDK
### 🐞 Bugfixes
* Fix variables translation miss-matches (#383) via Pol Miro (@polmiro)
* Fix translations for `price_after_free_trial` (#381) via Pol Miro (@polmiro)

### 🔄 Other Changes
* Storybook with globals (#374) via Pol Miro (@polmiro)

## 1.0.2
## RevenueCat SDK
### 🐞 Bugfixes
* WEB-2336: Adjusted the gaps and moved the product description below the title (#377) via Nicola Sacco (@nicfix)
* fix: prevent RangeError in formatPrice across browsers (#376) via Víctor Ferrer García (@vicfergar)

## 1.0.1
## RevenueCat SDK
### 🐞 Bugfixes
* WEB-2327: Added a close and a back button when not in element (#372) via Nicola Sacco (@nicfix)
* Upgrade vitest to 2.1.9 (#370) via Antonio Pérez (@anperezrc)

## 1.0.0
## RevenueCat SDK
### 💥 Breaking Changes
* User interface redesign (#296) via Alfonso Embid-Desmet (@alfondotnet)

The new design introduces a new color scheme. Please test it to verify it aligns with your website's colors.
You can always customize them from our dashboard.

### 📦 Dependency Updates
* upgrade vitest to 2.1.9 (#365) via Alfonso Embid-Desmet (@alfondotnet)
* Bump nokogiri from 1.17.1 to 1.18.3 (#327) via dependabot[bot] (@dependabot[bot])

## 0.18.2
## RevenueCat SDK
### 🐞 Bugfixes
* Add `prepaid` entitlement period support (#343) via Toni Rico (@tonidero)

## 0.18.1
## RevenueCat SDK
### 🐞 Bugfixes
* Added prefix to unprefixed class (#334) via Nicola Sacco (@nicfix)

## 0.18.0
### 🔄 Other Changes
* User events (#302) via Pol Miro (@polmiro)

## 0.17.0
## RevenueCat SDK
### ✨ New Features
* WEB-1998: Allow metadata to be sent at purchase (#281) via Nicola Sacco (@nicfix)

## 0.16.0
## RevenueCat SDK
### 📦 Dependency Updates
* Bump fastlane from 2.225.0 to 2.226.0 (#261) via dependabot[bot] (@dependabot[bot])

### 🔄 Other Changes
* [WEB-2016] Rename Web Billing (#283) via Antonio Borrero Granell (@antoniobg)

## 0.15.2
## RevenueCatUI SDK
### 🐞 Bugfixes
* Fix broken e2e tests + upgrade purchases-ui-js version (#270) via Guido Torres (@guido732)

### 🔄 Other Changes
* Quieter test logs (#284) via Pol Miro (@polmiro)
* chore: upgrade storybook to latest (#276) via Alfonso Embid-Desmet (@alfondotnet)
* chore: add console.error in example app when API is not set (#275) via Alfonso Embid-Desmet (@alfondotnet)

## 0.15.1
## RevenueCat SDK
### 🐞 Bugfixes
* Fix for the select options background color on windows (#267) via Nicola Sacco (@nicfix)

## 0.15.0
## RevenueCat SDK
### ✨ New Features
* feat: Added Support for Direct Payment Flow (#260) via Víctor Ferrer García (@vicfergar)

### 🔄 Other Changes
* add onError callback that rejects the promise of the rendering (#263) via Guido Torres (@guido732)
* Update fastlane plugin to include some fixes and some other dependencies (#265) via Toni Rico (@tonidero)

## 0.14.0
## RevenueCat SDK
### ✨ New Features
* ECO-1704: SDK Localization (#241) via Nicola Sacco (@nicfix)
### 🐞 Bugfixes
* Update purchase-params.ts (#257) via Nicola Sacco (@nicfix)
* ECO-1813: PR to fix price conversions in different languages. (#256) via Nicola Sacco (@nicfix)
* fix: Improve payment method validation by displaying Stripe errors in the form when possible (#248) via Víctor Ferrer García (@vicfergar)
### 🔄 Other Changes
* chore: Publish storybook in Chromatic (#255) via Víctor Ferrer García (@vicfergar)
* adds e2e for variable replacement (#254) via Guido Torres (@guido732)
* adds test for puchase flow using rc_paywalls (#252) via Guido Torres (@guido732)
* [ECO-1783] Rename RCBillingAppConfig properties (#250) via Roger Solé (@rogersole)
* adds test for puchase flow using rc_paywalls via Guido Torres
* adds husky pre-commit hook to auto fix linting and formatting (#249) via Guido Torres (@guido732)

## 0.13.1
## RevenueCat SDK

### 📦 Dependency Updates
* Bump rexml from 3.3.8 to 3.3.9 (#225) via dependabot[bot] (@dependabot[bot])
* Migrated all dependencies into devDependencies since we build a UMD package (#239) via Nicola Sacco (@nicfix)

### 🔄 Other Changes
* [ECO-1743] Make payment method "selected" color match accent color (#243) via Víctor Ferrer García (@vicfergar)
* fix: disable the submit button until the payment details are set (#245) via Víctor Ferrer García (@vicfergar)
* [ECO-1701] Pass the variables from the SDK to the paywall (#240) via Guido Torres (@guido732)
* Change "plan" to "subscription" on success page copy (#234) via Ed Shelley (@MrEdwardo)

## 0.13.0
## RevenueCat SDK
### ✨ New Features
* ECO-1606: @internal @experimental renderPaywall method (#227) via Nicola Sacco (@nicfix)
* Add convenience method to generate RC-like anonymous IDs (#235) via Antonio Borrero Granell (@antoniobg)
### 🐞 Bugfixes
* Removing the lateral padding based on screen width only (#237) via Nicola Sacco (@nicfix)
* Remove logout button from the paywall page in the demo app (#236) via Nicola Sacco (@nicfix)

## 0.12.1
## RevenueCat SDK
### 📦 Dependency Updates
* ECO-1595: Bumping to svelte 5 for the upcoming purchases-ui-web (#226) via Nicola Sacco (@nicfix)
* Bump cookie and @bundled-es-modules/cookie (#231) via dependabot[bot] (@dependabot[bot])

## 0.12.0
## RevenueCat SDK
### ✨ New Features
* [ECO-1560] Add redemption info data on status response (#220) via Roger Solé (@rogersole)
### 🐞 Bugfixes
* Change purchase API to avoid breaking change (#229) via Toni Rico (@tonidero)
* Customization: Aligned luminance with the one in the Customer Portal and the WPL (#224) via Nicola Sacco (@nicfix)
* fix: Typo in the default accent color (#221) via Víctor Ferrer García (@vicfergar)

### 🔄 Other Changes
* fix: Adjust the default luminance threshold from 0.2 to 0.37 (#228) via Víctor Ferrer García (@vicfergar)

## 0.11.2
## RevenueCat SDK
### 🐞 Bugfixes
* Fix handling unrecognized error codes in purchase operation (#217) via Toni Rico (@tonidero)
### 📦 Dependency Updates
* Bump fastlane from 2.224.0 to 2.225.0 (#219) via dependabot[bot] (@dependabot[bot])
* Bump danger from 9.5.0 to 9.5.1 (#218) via dependabot[bot] (@dependabot[bot])

### 🔄 Other Changes
* Demo App: Allow using anonymous IDs and generate deep links on demo app (#213) via Toni Rico (@tonidero)

## 0.11.1
## RevenueCat SDK
### 🐞 Bugfixes
* Restored the default accent and focus colors used before the customization implementation (#215) via Nicola Sacco (@nicfix)

## 0.11.0
## RevenueCat SDK
### ✨ New Features
* Customisation: Toggle product description from the product info panel (#212) via Nicola Sacco (@nicfix)
* Customization: Added shapes, background colors and generated text color. (#209) via Nicola Sacco (@nicfix)
### 🐞 Bugfixes
* Fix locale to 'en' (#210) via Jens-Fabian Goetzmann (@jefago)
### 📦 Dependency Updates
* Fix security vulnerabilities (#211) via Toni Rico (@tonidero)
* ECO-1336: Revamping storybook to make it easier to implement UI changes in the sdk (#206) via Nicola Sacco (@nicfix)

### 🔄 Other Changes
* ECO-1336-layout components (#207) via Nicola Sacco (@nicfix)
* Adds RELEASING.md (#205) via JayShortway (@JayShortway)
* Adds fastlane/.env.SAMPLE (#204) via JayShortway (@JayShortway)

## 0.10.0
## RevenueCat SDK
### ✨ New Features
* Add support for getting a single offering (#201) via Antonio Borrero Granell (@antoniobg)
* Implement appearance configuration overrides (#171) via Guido Torres (@guido732)
### 🐞 Bugfixes
* Fix error message purchasing already purchased non-consumables (#200) via Toni Rico (@tonidero)
### 📦 Dependency Updates
* Bump fastlane from 2.223.1 to 2.224.0 (#199) via dependabot[bot] (@dependabot[bot])
## 0.9.0
## RevenueCat SDK
### ✨ New Features
* Support non renewable products. (#191) via Toni Rico (@tonidero)

### 🔄 Other Changes
* Change endpoint to use the new `/purchase` (#194) via Toni Rico (@tonidero)
* Update UI to support consumables and non consumables (#193) via Toni Rico (@tonidero)

## 0.8.0
## RevenueCat SDK
### ✨ New Features
* Add support for `placements` (#189) via Toni Rico (@tonidero)
### 📦 Dependency Updates
* Bump fastlane from 2.222.0 to 2.223.1 (#192) via dependabot[bot] (@dependabot[bot])
* Bumped `vite-plugin-dts` version to the latest one (#184) via Nicola Sacco (@nicfix)
* Bump danger from 9.4.3 to 9.5.0 (#188) via dependabot[bot] (@dependabot[bot])
* Bump vite from 5.4.2 to 5.4.6 (#185) via dependabot[bot] (@dependabot[bot])
* Bump body-parser and express (#179) via dependabot[bot] (@dependabot[bot])

### 🔄 Other Changes
* Update fastlane plugin (#195) via Toni Rico (@tonidero)
* Update vite in demo app (#190) via Toni Rico (@tonidero)
* Add additional error details and display (#186) via Toni Rico (@tonidero)
* Create dependabot.yml (#187) via Toni Rico (@tonidero)
* [AUTOMATIC] Release/0.7.0 (#175) via RevenueCat Git Bot (@RCGitBot)

## 0.7.0
### New Features
* Create a `preload` method in `Purchases` to prefetch branding information. (#169) via Toni Rico (@tonidero)
* Add `amountMicros` to `Price` interface (#170) via Toni Rico (@tonidero)
### Bugfixes
* Improve purchase flow error handling for unknown errors (#173) via Toni Rico (@tonidero)
### Dependency Updates
* Bump svelte from 4.2.12 to 4.2.19 (#168) via dependabot[bot] (@dependabot[bot])
### Other Changes
* ECO-1398: Added the possibility to pass a currency in the demo app query string params (#167) via Nicola Sacco (@nicfix)

## 0.6.0
### New Features
* [Beta] Support different currencies (#161) via Toni Rico (@tonidero)
* Make main CTA not say "Pay" if the customer is starting a trial (#164) via Jens-Fabian Goetzmann (@jefago)
### Dependency Updates
* Bump rexml from 3.3.3 to 3.3.6 (#163) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Improve formatted price calculation (#160) via Toni Rico (@tonidero)
* Eco 1249 rcbilling hostedcheckout add test harness for routes (#159) via Guido Torres (@guido732)

## 0.5.0
### New Features
* Add `presentedOfferingContext` type to include all context information (#152) via Toni Rico (@tonidero)
### Dependency Updates
* Bump rexml from 3.2.8 to 3.3.3 (#156) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Update api-extractor and only diff markdown file for api tests (#154) via Toni Rico (@tonidero)
* Change modal border radius to 16px (#151) via Jens-Fabian Goetzmann (@jefago)
* [Behavior change] Fail configuration if trying to add additional headers that are reserved for SDK (#150) via Toni Rico (@tonidero)

## 0.4.0
### New Features
* Add support for `proxyURL` to redirect requests (#148) via Toni Rico (@tonidero)
* Add support for adding additional headers on http requests (#147) via Toni Rico (@tonidero)
### Bugfixes
* [EXTERNAL] Fix storybook development mode (#145) contributed by @AbraaoAlves (#146) via Toni Rico (@tonidero)

## 0.3.4
### Dependency Updates
* Update storybook to fix security concern (#142) via Toni Rico (@tonidero)
### Other Changes
* Add backend email validation errors display to email screen (#143) via Toni Rico (@tonidero)

## 0.3.3
### Bugfixes
* Fix side info not showing when not specifying purchase option (#138) via Toni Rico (@tonidero)

## 0.3.2
### Dependency Updates
* Bump braces from 3.0.2 to 3.0.3 (#129) via dependabot[bot] (@dependabot[bot])
* Bump ws from 6.2.2 to 6.2.3 (#131) via dependabot[bot] (@dependabot[bot])
### Other Changes
* Validate email in SDK (#135) via Toni Rico (@tonidero)
* Show better errors in purchase flow when user is subscribed (#133) via Toni Rico (@tonidero)

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
