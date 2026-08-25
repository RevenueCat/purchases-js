/**
 * Checkout settings configured on the RevenueCat dashboard and forwarded by the
 * backend, merged over the SDK's defaults before being handed to Paddle's
 * `Checkout.open({ settings })`.
 * Intentionally an open record so we can forward newly supported Paddle settings
 * without requiring an SDK release.
 */
export type PaddleCheckoutSettings = Record<string, boolean | string>;
