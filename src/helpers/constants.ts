export const VERSION = "1.72.0";
/**
 * Payrails checkout stays off until the drop-in is ready to ship.
 * Tests that mount it opt in by mocking this flag.
 */
export const PAYRAILS_CHECKOUT_ENABLED =
  import.meta.env.VITE_PAYRAILS_CHECKOUT_ENABLED === "true";
export const RC_ENDPOINT = import.meta.env.VITE_RC_ENDPOINT as string;
export const RC_ANALYTICS_ENDPOINT = import.meta.env
  .VITE_RC_ANALYTICS_ENDPOINT as string;
