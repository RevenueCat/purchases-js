/**
 * Checkout settings configured on the RevenueCat dashboard and forwarded by the
 * backend, merged over the SDK's defaults before being handed to Paddle's
 * `Checkout.open({ settings })`.
 *
 * Keys and values map 1:1 to Paddle's own checkout settings, which are not all
 * booleans: `variant`, for example, is `"one-page" | "multi-page" | "express"`,
 * so express checkout can only be expressed once strings are allowed here.
 * Kept as an open record (rather than a closed union of the settings we know
 * about today) so the backend can forward newly supported Paddle settings
 * without requiring an SDK release.
 */
export type PaddleCheckoutSettings = Record<string, boolean | string>;
