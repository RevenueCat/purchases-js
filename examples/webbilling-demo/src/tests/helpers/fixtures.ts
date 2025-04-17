export const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
export const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";
export const NON_TAX_TEST_API_KEY = process.env.VITE_RC_NON_TAX_E2E_API_KEY;
export const TAX_TEST_API_KEY = process.env.VITE_RC_TAX_E2E_API_KEY;
export const TAX_TEST_OFFERING_ID = "rcb_e2e_taxes";
export const LOCAL_URL = "http://localhost:3001/";
export const BASE_URL =
  (process.env?.VITE_RC_BILLING_DEMO_URL as string | undefined) ?? LOCAL_URL;
export const VITE_RC_ENDPOINT = process.env.VITE_RC_ENDPOINT as
  | string
  | undefined;
export const VITE_RC_ANALYTICS_ENDPOINT = process.env
  ?.VITE_RC_ANALYTICS_ENDPOINT as string | undefined;

export const INVALID_CUSTOMER_DETAILS = {
  countryCode: "US",
  postalCode: "00093",
};

export const FLORIDA_CUSTOMER_DETAILS = {
  countryCode: "US",
  postalCode: "33125",
};

export const NEW_YORK_CUSTOMER_DETAILS = {
  countryCode: "US",
  postalCode: "12345",
};

export const ITALY_CUSTOMER_DETAILS = {
  countryCode: "IT",
};
