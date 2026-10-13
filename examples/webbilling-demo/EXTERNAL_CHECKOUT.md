# External checkout POC

Set an external public API key in `VITE_RC_API_KEY` and set
`VITE_EXTERNAL_CHECKOUT_URL=http://localhost:3010/api/checkout`.
The playground runs on port 3010. Run the SDK demo on port 3011 when both are
running, using `pnpm run dev -- --port 3011` from the demo directory.
Use a RevenueCat offering whose merchant product identifiers match the playground
catalog (`epapi_demo_basic`, `epapi_demo_plus`, or `epapi_demo_lifetime`).

Pressing Purchase generates a new SDK checkout token and redirects to the
playground with `app_user_id`, `product_id`, `checkout_token` and `return_url`.
The return URL also contains that token. The playground retains it in the stored
checkout URL and redirects there after successful payment.

The demo's `/checkout-return/:app_user_id` route reads the token, configures the
SDK with `externalCheckoutReturnToken`, loads customer info and offerings, and
shows the success page with current subscriptions and entitlements. Its Continue
link follows the app's continuation path carried in the URL. No browser storage
is used for checkout context.

Tokens are currently client-generated correlation values. They are not verified
and do not prove payment or grant entitlements. Khepri token generation and
verification will be added later. The original purchase promise stays pending
while navigation unloads the original page; it is not resumed by the return page.
