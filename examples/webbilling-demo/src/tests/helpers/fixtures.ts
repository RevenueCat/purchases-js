import type { RouteFulfillOptions } from "./test-helpers";

type CheckoutCalculateTaxResponse = {
  operation_session_id: string;
  currency: string;
  total_amount_in_micros: number;
  tax_amount_in_micros: number;
  total_excluding_tax_in_micros: number;
  tax_inclusive: boolean;
  tax_breakdown: Array<{
    display_name: string;
    tax_amount_in_micros: number;
  }>;
  pricing_phases: {
    base: {
      tax_breakdown: Array<{
        display_name: string;
        tax_amount_in_micros: number;
      }>;
    };
  };
  gateway_params: {
    elements_configuration: {
      amount: number;
      currency: string;
      mode: "payment";
      payment_method_types: string[];
      setup_future_usage: "off_session";
    };
  };
  failed_reason?: string;
};

export const RC_PAYWALL_TEST_OFFERING_ID = "rc_paywalls_e2e_test_2";
export const RC_PAYWALL_TEST_OFFERING_ID_WITH_VARIABLES =
  "rc_paywalls_e2e_test_variables_2";
export const RC_PAYWALL_WITH_LATAM_TRANSLATION_OFFERING_ID =
  "rc_paywalls_e2e_test_latam_es";
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

export const SPAIN_TAX_RESPONSE: RouteFulfillOptions = {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    mocked: true,
    currency: "USD",
    failed_reason: undefined,
    gateway_params: {
      elements_configuration: {
        amount: 999,
        currency: "usd",
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      },
    },
    operation_session_id: "MOCKED",
    tax_breakdown: [
      {
        display_name: "VAT - Spain (21%)",
        tax_amount_in_micros: 1730000,
      },
    ],
    pricing_phases: {
      base: {
        tax_breakdown: [
          {
            display_name: "VAT - Spain (21%)",
            tax_amount_in_micros: 1730000,
          },
        ],
      },
    },
    tax_amount_in_micros: 1730000,
    total_amount_in_micros: 9990000,
    total_excluding_tax_in_micros: 8260000,
    tax_inclusive: true,
  } as CheckoutCalculateTaxResponse),
};

export const ITALY_TAX_RESPONSE: RouteFulfillOptions = {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    mocked: true,
    currency: "USD",
    failed_reason: undefined,
    gateway_params: {
      elements_configuration: {
        amount: 999,
        currency: "usd",
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      },
    },
    operation_session_id: "MOCKED",
    tax_breakdown: [
      {
        display_name: "VAT - Italy (22%)",
        tax_amount_in_micros: 1800000,
      },
    ],
    pricing_phases: {
      base: {
        tax_breakdown: [
          {
            display_name: "VAT - Italy (22%)",
            tax_amount_in_micros: 1800000,
          },
        ],
      },
    },
    tax_amount_in_micros: 1800000,
    total_amount_in_micros: 9990000,
    total_excluding_tax_in_micros: 8190000,
    tax_inclusive: true,
  } as CheckoutCalculateTaxResponse),
};

export const NEW_YORK_TAX_RESPONSE: RouteFulfillOptions = {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    mocked: true,
    currency: "USD",
    failed_reason: undefined,
    gateway_params: {
      elements_configuration: {
        amount: 999,
        currency: "usd",
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      },
    },
    operation_session_id: "MOCKED",
    tax_breakdown: [
      {
        display_name: "Sales Tax - New York (Exempt)",
        tax_amount_in_micros: 0,
      },
    ],
    pricing_phases: {
      base: {
        tax_breakdown: [
          {
            display_name: "Sales Tax - New York (Exempt)",
            tax_amount_in_micros: 0,
          },
        ],
      },
    },
    tax_amount_in_micros: 0,
    total_amount_in_micros: 9990000,
    total_excluding_tax_in_micros: 9990000,
    tax_inclusive: false,
  } as CheckoutCalculateTaxResponse),
};

export const NOT_COLLECTING_TAX_RESPONSE: RouteFulfillOptions = {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    mocked: true,
    currency: "USD",
    failed_reason: undefined,
    gateway_params: {
      elements_configuration: {
        amount: 999,
        currency: "usd",
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      },
    },
    operation_session_id: "MOCKED",
    tax_breakdown: [],
    pricing_phases: {
      base: {
        tax_breakdown: [],
      },
    },
    tax_amount_in_micros: 0,
    total_amount_in_micros: 9990000,
    total_excluding_tax_in_micros: 9990000,
    tax_inclusive: false,
  } as CheckoutCalculateTaxResponse),
};

export const INVALID_TAX_LOCATION_RESPONSE: RouteFulfillOptions = {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    mocked: true,
    currency: "USD",
    failed_reason: "invalid_tax_location",
    gateway_params: {
      elements_configuration: {
        amount: 999,
        currency: "usd",
        mode: "payment",
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      },
    },
    operation_session_id: "MOCKED",
    tax_breakdown: [],
    pricing_phases: {
      base: {
        tax_breakdown: [],
      },
    },
    tax_amount_in_micros: 0,
    total_amount_in_micros: 9990000,
    total_excluding_tax_in_micros: 9990000,
    tax_inclusive: true,
  } as CheckoutCalculateTaxResponse),
};

export const STRIPE_TAX_NOT_ACTIVE_RESPONSE: RouteFulfillOptions = {
  status: 422,
  json: {
    mocked: true,
    code: 7898,
    message:
      "Stripe account setup error: Stripe Tax must be active to calculate taxes.",
  },
};

export const INVALID_TAX_ORIGIN_RESPONSE: RouteFulfillOptions = {
  status: 422,
  json: {
    mocked: true,
    code: 7899,
    message:
      "Stripe account setup error: Origin address for Stripe Tax is missing or invalid.",
  },
};

export const MISSING_STRIPE_PERMISSION_RESPONSE: RouteFulfillOptions = {
  status: 422,
  json: {
    mocked: true,
    code: 7900,
    message: "Stripe account setup error: Required permission is missing.",
  },
};
