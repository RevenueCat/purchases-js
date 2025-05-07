export const VERSION = "1.3.0";
export const RC_ENDPOINT = import.meta.env.VITE_RC_ENDPOINT as string;
export const RC_ANALYTICS_ENDPOINT = import.meta.env
  .VITE_RC_ANALYTICS_ENDPOINT as string;
export const ALLOW_TAX_CALCULATION_FF =
  import.meta.env.VITE_ALLOW_TAX_CALCULATION_FF === "true";
