## RevenueCat SDK
### ✨ New Features
* Add `@revenuecat/purchases-js/pure` entrypoint that resolves `@stripe/stripe-js` to its `/pure` variant, so Stripe.js is not auto-loaded at SDK initialization. Intended for consumers bundling with Rollup's `output.inlineDynamicImports: true`.

## RevenueCatUI SDK
### 🐞 Bugfixes
* Paywalls | Update purchases-ui-js to support visibility from custom variables w/tests (#870) via Rosie Watson (@RosieWatson)
