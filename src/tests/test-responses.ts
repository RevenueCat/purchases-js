import { http, HttpResponse, type RequestHandler } from "msw";
import type { OfferingsResponse } from "../networking/responses/offerings-response";
import { vi } from "vitest";
import type {
  ProductResponse,
  ProductsResponse,
} from "../networking/responses/products-response";
import { type CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";
import { StripeElementsSetupFutureUsage } from "../networking/responses/stripe-elements";
import { StripeElementsMode } from "../networking/responses/stripe-elements";
import type { CheckoutPrepareResponse } from "../networking/responses/checkout-prepare-response";
import type { SubscriberResponse } from "../networking/responses/subscriber-response";

const monthlyProductResponse: ProductResponse = {
  identifier: "monthly",
  product_type: "subscription",
  title: "Monthly test",
  description: null,
  default_purchase_option_id: "base_option",
  purchase_options: {
    base_option: {
      id: "base_option",
      price_id: "test_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 3000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: null,
    },
  },
};

const monthly2ProductResponse: ProductResponse = {
  identifier: "monthly_2",
  product_type: "subscription",
  title: "Monthly test 2",
  description: "monthly description",
  default_purchase_option_id: "offer_12345",
  purchase_options: {
    offer_12345: {
      id: "offer_12345",
      price_id: "test_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 5000000,
          currency: "USD",
        },
      },
      trial: {
        period_duration: "P1W",
        cycle_count: 1,
        price: null,
      },
      intro_price: null,
      discount: null,
    },
  },
};

const monthlyWithIntroPriceProductResponse: ProductResponse = {
  identifier: "monthly_intro",
  product_type: "subscription",
  title: "Monthly with Intro Price",
  description: "Monthly subscription with introductory pricing",
  default_purchase_option_id: "intro_option",
  purchase_options: {
    intro_option: {
      id: "intro_option",
      price_id: "test_intro_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 9990000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: {
        period_duration: "P1M",
        cycle_count: 3, // Recurring for 3 cycles
        price: {
          amount_micros: 1990000,
          currency: "USD",
        },
      },
      discount: null,
    },
  },
};

const monthlyWithUpfrontIntroPriceProductResponse: ProductResponse = {
  identifier: "monthly_intro_upfront",
  product_type: "subscription",
  title: "Monthly with Intro Price Paid Upfront",
  description: "Monthly subscription with introductory pricing paid upfront",
  default_purchase_option_id: "intro_upfront_option",
  purchase_options: {
    intro_upfront_option: {
      id: "intro_upfront_option",
      price_id: "test_intro_upfront_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 9990000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: {
        period_duration: "P6M",
        cycle_count: 1, // One-time upfront payment
        price: {
          amount_micros: 6990000,
          currency: "USD",
        },
      },
      discount: null,
    },
  },
};

const monthlyWithTrialAndIntroPriceProductResponse: ProductResponse = {
  identifier: "monthly_trial_intro",
  product_type: "subscription",
  title: "Monthly with Trial and Intro Price",
  description: "Monthly subscription with trial and intro pricing",
  default_purchase_option_id: "trial_intro_option",
  purchase_options: {
    trial_intro_option: {
      id: "trial_intro_option",
      price_id: "test_trial_intro_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 14990000,
          currency: "USD",
        },
      },
      trial: {
        period_duration: "P1W",
        cycle_count: 1,
        price: null,
      },
      intro_price: {
        period_duration: "P1M",
        cycle_count: 6,
        price: {
          amount_micros: 4990000,
          currency: "USD",
        },
      },
      discount: null,
    },
  },
};

const monthlyWithOneTimeDiscountProductResponse: ProductResponse = {
  identifier: "monthly_one_time_discount",
  product_type: "subscription",
  title: "Monthly with One-Time Discount",
  description: "Monthly subscription with one-time discount",
  default_purchase_option_id: "one_time_discount_option",
  purchase_options: {
    one_time_discount_option: {
      id: "one_time_discount_option",
      price_id: "test_one_time_discount_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 10000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: {
        duration_mode: "one_time",
        time_window: null,
        discount_type: "percentage",
        percentage: 20,
        fixed_amount_micros: null,
        amount_micros: 8000000,
        currency: "USD",
        name: "One-Time 20% Discount",
      },
    },
  },
};

const monthlyWithTimeWindowDiscountProductResponse: ProductResponse = {
  identifier: "monthly_time_window_discount",
  product_type: "subscription",
  title: "Monthly with Time Window Discount",
  description: "Monthly subscription with time window discount",
  default_purchase_option_id: "time_window_discount_option",
  purchase_options: {
    time_window_discount_option: {
      id: "time_window_discount_option",
      price_id: "test_time_window_discount_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 10000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: {
        duration_mode: "time_window",
        time_window: "P3M",
        discount_type: "percentage",
        percentage: 30,
        fixed_amount_micros: null,
        amount_micros: 7000000,
        currency: "USD",
        name: "Holiday Sale 30%",
      },
    },
  },
};

const monthlyWithForeverDiscountProductResponse: ProductResponse = {
  identifier: "monthly_forever_discount",
  product_type: "subscription",
  title: "Monthly with Forever Discount",
  description: "Monthly subscription with forever discount",
  default_purchase_option_id: "forever_discount_option",
  purchase_options: {
    forever_discount_option: {
      id: "forever_discount_option",
      price_id: "test_forever_discount_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 10000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: {
        duration_mode: "forever",
        time_window: null,
        discount_type: "percentage",
        percentage: 40,
        fixed_amount_micros: null,
        amount_micros: 6000000,
        currency: "USD",
        name: "Forever 40% Discount",
      },
    },
  },
};

const monthlyWithFixedAmountDiscountProductResponse: ProductResponse = {
  identifier: "monthly_fixed_amount_discount",
  product_type: "subscription",
  title: "Monthly with Fixed Amount Discount",
  description: "Monthly subscription with fixed amount discount",
  default_purchase_option_id: "fixed_amount_discount_option",
  purchase_options: {
    fixed_amount_discount_option: {
      id: "fixed_amount_discount_option",
      price_id: "test_fixed_amount_discount_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 10000000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: null,
      discount: {
        duration_mode: "one_time",
        time_window: null,
        discount_type: "fixed_amount",
        percentage: null,
        fixed_amount_micros: 2500000,
        amount_micros: 7500000,
        currency: "USD",
        name: "$2.50 Off",
      },
    },
  },
};

const monthlyWithIntroPriceNullPriceProductResponse: ProductResponse = {
  identifier: "monthly_intro_null_price",
  product_type: "subscription",
  title: "Monthly with Intro Price Null Price",
  description: "Monthly subscription with intro price that has null price",
  default_purchase_option_id: "intro_null_price_option",
  purchase_options: {
    intro_null_price_option: {
      id: "intro_null_price_option",
      price_id: "test_intro_null_price_id",
      base: {
        period_duration: "P1M",
        cycle_count: 1,
        price: {
          amount_micros: 9990000,
          currency: "USD",
        },
      },
      trial: null,
      intro_price: {
        period_duration: "P1M",
        cycle_count: 3,
        price: null,
      },
      discount: null,
    },
  },
};

const productWithNullBaseResponse: ProductResponse = {
  identifier: "monthly_null_base",
  product_type: "subscription",
  title: "Monthly with Null Base",
  description: "Monthly subscription with null base phase",
  default_purchase_option_id: "null_base_option",
  purchase_options: {
    null_base_option: {
      id: "null_base_option",
      price_id: "test_price_id",
      base: null,
      trial: null,
      intro_price: {
        period_duration: "P1M",
        cycle_count: 3,
        price: {
          amount_micros: 1990000,
          currency: "USD",
        },
      },
      discount: null,
    },
  },
};

const consumableProductResponse: ProductResponse = {
  identifier: "test-consumable-product",
  product_type: "consumable",
  title: "Consumable test",
  description: "Consumable description",
  default_purchase_option_id: "offer_12345",
  purchase_options: {
    offer_12345: {
      id: "base_option",
      price_id: "test_price_id",
      base_price: {
        amount_micros: 1000000,
        currency: "USD",
      },
      discount: null,
    },
  },
};

const consumableWithOneTimeDiscountProductResponse: ProductResponse = {
  identifier: "test-consumable-one-time-discount",
  product_type: "consumable",
  title: "Consumable with One-Time Discount",
  description: "Consumable product with one-time discount",
  default_purchase_option_id: "consumable_discount_option",
  purchase_options: {
    consumable_discount_option: {
      id: "consumable_discount_option",
      price_id: "test_consumable_discount_price_id",
      base_price: {
        amount_micros: 1000000,
        currency: "USD",
      },
      discount: {
        duration_mode: "one_time",
        time_window: null,
        discount_type: "percentage",
        percentage: 20,
        fixed_amount_micros: null,
        amount_micros: 800000,
        currency: "USD",
        name: "Consumable 20% Discount",
      },
    },
  },
};

export const productsResponse: ProductsResponse = {
  product_details: [monthlyProductResponse, monthly2ProductResponse],
};

export const productsWithIntroPriceResponse: ProductsResponse = {
  product_details: [
    monthlyProductResponse,
    monthly2ProductResponse,
    monthlyWithIntroPriceProductResponse,
    monthlyWithTrialAndIntroPriceProductResponse,
  ],
};

export const productsWithDiscountsResponse: ProductsResponse = {
  product_details: [
    monthlyProductResponse,
    monthly2ProductResponse,
    monthlyWithOneTimeDiscountProductResponse,
    monthlyWithTimeWindowDiscountProductResponse,
    monthlyWithForeverDiscountProductResponse,
  ],
};

export const productsWithFixedAmountDiscountResponse: ProductsResponse = {
  product_details: [monthlyWithFixedAmountDiscountProductResponse],
};

export const productsWithIntroPriceNullPriceResponse: ProductsResponse = {
  product_details: [monthlyWithIntroPriceNullPriceProductResponse],
};

export const productsWithUpfrontIntroPriceResponse: ProductsResponse = {
  product_details: [monthlyWithUpfrontIntroPriceProductResponse],
};

export const productsWithNullBaseResponse: ProductsResponse = {
  product_details: [productWithNullBaseResponse],
};

export const productsWithConsumableDiscountResponse: ProductsResponse = {
  product_details: [consumableWithOneTimeDiscountProductResponse],
};

export const offeringsArray = [
  {
    identifier: "offering_1",
    description: "Offering 1",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly",
        platform_product_identifier: "monthly",
      },
    ],
    paywall_components: null,
  },
  {
    identifier: "offering_2",
    description: "Offering 2",
    metadata: null,
    packages: [
      {
        identifier: "package_2",
        platform_product_identifier: "monthly_2",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithIntroPriceArray = [
  {
    identifier: "offering_intro",
    description: "Offering with Intro Price",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_intro",
        platform_product_identifier: "monthly_intro",
      },
    ],
    paywall_components: null,
  },
  {
    identifier: "offering_trial_intro",
    description: "Offering with Trial and Intro Price",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_trial_intro",
        platform_product_identifier: "monthly_trial_intro",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithDiscountsArray = [
  {
    identifier: "offering_one_time_discount",
    description: "Offering with One-Time Discount",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_one_time_discount",
        platform_product_identifier: "monthly_one_time_discount",
      },
    ],
    paywall_components: null,
  },
  {
    identifier: "offering_time_window_discount",
    description: "Offering with Time Window Discount",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_time_window_discount",
        platform_product_identifier: "monthly_time_window_discount",
      },
    ],
    paywall_components: null,
  },
  {
    identifier: "offering_forever_discount",
    description: "Offering with Forever Discount",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_forever_discount",
        platform_product_identifier: "monthly_forever_discount",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithFixedAmountDiscountArray = [
  {
    identifier: "offering_fixed_amount_discount",
    description: "Offering with Fixed Amount Discount",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_fixed_amount_discount",
        platform_product_identifier: "monthly_fixed_amount_discount",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithIntroPriceNullPriceArray = [
  {
    identifier: "offering_intro_null_price",
    description: "Offering with Intro Price Null Price",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_intro_null_price",
        platform_product_identifier: "monthly_intro_null_price",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithUpfrontIntroPriceArray = [
  {
    identifier: "offering_intro_upfront",
    description: "Offering with Intro Price Paid Upfront",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_intro_upfront",
        platform_product_identifier: "monthly_intro_upfront",
      },
    ],
    paywall_components: null,
  },
];

export const offeringsWithNullBaseArray = [
  {
    identifier: "offering_null_base",
    description: "Offering with Product Having Null Base",
    metadata: null,
    packages: [
      {
        identifier: "$rc_monthly_null_base",
        platform_product_identifier: "monthly_null_base",
      },
    ],
    paywall_components: null,
  },
];

export const checkoutPrepareResponse: CheckoutPrepareResponse = {
  stripe_gateway_params: {
    publishable_api_key: "test_publishable_api_key",
    stripe_account_id: "test_stripe_account_id",
    elements_configuration: {
      mode: StripeElementsMode.Payment,
      payment_method_types: ["card"],
      setup_future_usage: StripeElementsSetupFutureUsage.OnSession,
      amount: 300,
      currency: "USD",
    },
  },
  paypal_gateway_params: {
    client_access_token: "test_paypal_access_token",
  },
  paddle_billing_params: {
    client_side_token: "test_client_side_token",
    is_sandbox: true,
  },
};

export const customerInfoResponse: SubscriberResponse = {
  request_date: "2024-01-22T13:23:07Z",
  request_date_ms: 1705929787636,
  subscriber: {
    entitlements: {
      expiredCatServices: {
        expires_date: "2023-12-20T16:48:42Z",
        grace_period_expires_date: null,
        product_identifier: "black_f_friday_worten_2",
        product_plan_identifier: "plan_id",
        purchase_date: "2023-12-19T16:48:42Z",
      },
      activeCatServices: {
        expires_date: "2053-12-20T16:48:42Z",
        grace_period_expires_date: null,
        product_identifier: "black_f_friday_worten",
        purchase_date: "2023-12-19T16:48:42Z",
      },
    },
    first_seen: "2023-11-20T16:48:29Z",
    last_seen: "2023-11-20T16:48:29Z",
    management_url: "https://test-management-url.revenuecat.com",
    non_subscriptions: {
      consumable: [
        {
          id: "abcd1234",
          is_sandbox: true,
          original_purchase_date: "2025-04-03T16:14:47Z",
          purchase_date: "2025-04-03T16:14:47Z",
          store: "play_store",
          store_transaction_id: "GPA.0000-0000-0000-00000",
        },
      ],
    },
    original_app_user_id: "someAppUserId",
    original_application_version: null,
    original_purchase_date: null,
    other_purchases: {},
    subscriptions: {
      black_f_friday_worten_2: {
        auto_resume_date: null,
        billing_issues_detected_at: null,
        expires_date: "2024-01-22T16:48:42Z",
        grace_period_expires_date: null,
        is_sandbox: true,
        management_url:
          "https://test-management-url.revenuecat.com/manage/one_transaction_id",
        original_purchase_date: "2023-11-20T16:48:42Z",
        period_type: "normal",
        purchase_date: "2024-01-21T16:48:42Z",
        refunded_at: null,
        store: "rc_billing",
        store_transaction_id: "one_transaction_id",
        unsubscribe_detected_at: null,
        ownership_type: "FAMILY_SHARED",
      },
      black_f_friday_worten: {
        auto_resume_date: null,
        billing_issues_detected_at: null,
        expires_date: "2054-01-22T16:48:42Z",
        grace_period_expires_date: null,
        is_sandbox: true,
        management_url:
          "https://test-management-url.revenuecat.com/manage/another_transaction_id",
        original_purchase_date: "2023-11-20T16:48:42Z",
        period_type: "normal",
        purchase_date: "2024-01-21T16:48:42Z",
        refunded_at: null,
        store: "rc_billing",
        store_transaction_id: "another_transaction_id",
        unsubscribe_detected_at: null,
      },
    },
  },
};

export const newAppUserIdCustomerInfoResponse = {
  request_date: "2024-01-22T13:23:07Z",
  request_date_ms: 1705929787636,
  subscriber: {
    entitlements: {},
    first_seen: "2023-11-20T16:48:29Z",
    last_seen: "2023-11-20T16:48:29Z",
    management_url: "https://test-management-url.revenuecat.com",
    non_subscriptions: {},
    original_app_user_id: "newAppUserId",
    original_application_version: null,
    original_purchase_date: null,
    other_purchases: {},
    subscriptions: {},
  },
};

const offeringsResponsesPerUserId: { [userId: string]: OfferingsResponse } = {
  someAppUserId: {
    current_offering_id: "offering_1",
    offerings: offeringsArray,
    placements: {
      fallback_offering_id: "offering_1",
      offering_ids_by_placement: {
        test_placement_id: "offering_2",
        test_null_placement_id: null,
      },
    },
    targeting: {
      rule_id: "test_rule_id",
      revision: 123,
    },
  },
  appUserIdWithoutCurrentOfferingId: {
    current_offering_id: null,
    offerings: offeringsArray,
  },
  appUserIdWithMissingProducts: {
    current_offering_id: "offering_2",
    offerings: offeringsArray,
  },
  appUserIdWithNonSubscriptionProducts: {
    current_offering_id: "offering_consumables",
    offerings: [
      {
        identifier: "offering_consumables",
        description: "Offering consumable",
        metadata: null,
        packages: [
          {
            identifier: "test-consumable-package",
            platform_product_identifier: "test-consumable-product",
          },
        ],
        paywall_components: null,
      },
    ],
  },
  appUserIdWithConsumableDiscount: {
    current_offering_id: "offering_consumable_discount",
    offerings: [
      {
        identifier: "offering_consumable_discount",
        description: "Offering with Consumable Discount",
        metadata: null,
        packages: [
          {
            identifier: "test-consumable-discount-package",
            platform_product_identifier: "test-consumable-one-time-discount",
          },
        ],
        paywall_components: null,
      },
    ],
  },
  appUserIdWithIntroPricing: {
    current_offering_id: "offering_intro",
    offerings: offeringsWithIntroPriceArray,
  },
  appUserIdWithTrialAndIntroPricing: {
    current_offering_id: "offering_trial_intro",
    offerings: offeringsWithIntroPriceArray,
  },
  appUserIdWithOneTimeDiscount: {
    current_offering_id: "offering_one_time_discount",
    offerings: offeringsWithDiscountsArray,
  },
  appUserIdWithTimeWindowDiscount: {
    current_offering_id: "offering_time_window_discount",
    offerings: offeringsWithDiscountsArray,
  },
  appUserIdWithForeverDiscount: {
    current_offering_id: "offering_forever_discount",
    offerings: offeringsWithDiscountsArray,
  },
  appUserIdWithFixedAmountDiscount: {
    current_offering_id: "offering_fixed_amount_discount",
    offerings: offeringsWithFixedAmountDiscountArray,
  },
  appUserIdWithIntroPriceNullPrice: {
    current_offering_id: "offering_intro_null_price",
    offerings: offeringsWithIntroPriceNullPriceArray,
  },
  appUserIdWithUpfrontIntroPrice: {
    current_offering_id: "offering_intro_upfront",
    offerings: offeringsWithUpfrontIntroPriceArray,
  },
  appUserIdWithNullBase: {
    current_offering_id: "offering_null_base",
    offerings: offeringsWithNullBaseArray,
  },
};

const productsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: productsResponse,
  appUserIdWithoutCurrentOfferingId: productsResponse,
  appUserIdWithMissingProducts: { product_details: [monthlyProductResponse] },
  appUserIdWithNonSubscriptionProducts: {
    product_details: [consumableProductResponse],
  },
  appUserIdWithIntroPricing: productsWithIntroPriceResponse,
  appUserIdWithTrialAndIntroPricing: productsWithIntroPriceResponse,
  appUserIdWithOneTimeDiscount: productsWithDiscountsResponse,
  appUserIdWithTimeWindowDiscount: productsWithDiscountsResponse,
  appUserIdWithForeverDiscount: productsWithDiscountsResponse,
  appUserIdWithFixedAmountDiscount: productsWithFixedAmountDiscountResponse,
  appUserIdWithIntroPriceNullPrice: productsWithIntroPriceNullPriceResponse,
  appUserIdWithUpfrontIntroPrice: productsWithUpfrontIntroPriceResponse,
  appUserIdWithNullBase: productsWithNullBaseResponse,
  appUserIdWithConsumableDiscount: productsWithConsumableDiscountResponse,
};

const customerInfoResponsePerUserId: { [userId: string]: object } = {
  someAppUserId: customerInfoResponse,
  newAppUserId: newAppUserIdCustomerInfoResponse,
  "test-app-user-id-with-0-currencies": newAppUserIdCustomerInfoResponse,
  "test-app-user-id-with-3-currencies": newAppUserIdCustomerInfoResponse,
};

const brandingInfoResponse = {
  app_icon: null,
  app_icon_webp: null,
  id: "test-app-id",
  app_name: "Test Company name",
  support_email: "test-rcbilling-support@revenuecat.com",
};

export const checkoutStartResponse: CheckoutStartResponse = {
  operation_session_id: "test-operation-session-id",
  gateway_params: {
    stripe_account_id: "test-stripe-account-id",
    publishable_api_key: "test-publishable-api-key",
    elements_configuration: {
      mode: StripeElementsMode.Setup,
      payment_method_types: ["card"],
      setup_future_usage: StripeElementsSetupFutureUsage.OffSession,
    },
  },
  management_url: "https://test-management-url.revenuecat.com",
  paddle_billing_params: null,
};

export const checkoutCompleteResponse: CheckoutCompleteResponse = {
  operation_session_id: "test-operation-session-id",
  gateway_params: {
    client_secret: "test-client-secret",
  },
};

export const getVirtualCurrenciesResponseWith3Currencies = {
  virtual_currencies: {
    GLD: {
      balance: 100,
      code: "GLD",
      description: "It's gold",
      name: "Gold",
    },
    SLV: {
      balance: 100,
      code: "SLV",
      name: "Silver",
    },
    BRNZ: {
      balance: -1,
      code: "BRNZ",
      description: "It's bronze",
      name: "Bronze",
    },
  },
};

export const getVirtualCurrenciesResponseWithNoCurrencies = {
  virtual_currencies: {},
};

export interface GetRequest {
  url: string;
}

export const APIGetRequest = vi.fn();
export const APIPostRequest = vi.fn();

export const eventsURL = "http://localhost:8000/v1/events";

export function getRequestHandlers(): RequestHandler[] {
  const requestHandlers: RequestHandler[] = [];
  Object.keys(offeringsResponsesPerUserId).forEach((userId: string) => {
    const body = offeringsResponsesPerUserId[userId]!;
    const url = `http://localhost:8000/v1/subscribers/${userId}/offerings`;
    requestHandlers.push(
      http.get(url, ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json(body, { status: 200 });
      }),
    );
  });

  Object.keys(productsResponsesPerUserId).forEach((userId: string) => {
    const body = productsResponsesPerUserId[userId]!;
    const url = `http://localhost:8000/rcbilling/v1/subscribers/${userId}/products`;
    requestHandlers.push(
      http.get(url, ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json(body, { status: 200 });
      }),
    );
  });

  Object.keys(customerInfoResponsePerUserId).forEach((userId: string) => {
    const body = customerInfoResponsePerUserId[userId]!;
    const url = `http://localhost:8000/v1/subscribers/${userId}`;
    requestHandlers.push(
      http.get(url, ({ request }) => {
        APIGetRequest({ url: request.url });
        return HttpResponse.json(body, { status: 200 });
      }),
    );
  });

  const brandingUrl = "http://localhost:8000/rcbilling/v1/branding";
  requestHandlers.push(
    http.get(brandingUrl, ({ request }) => {
      APIGetRequest({ url: request.url });
      return HttpResponse.json(brandingInfoResponse, { status: 200 });
    }),
  );

  requestHandlers.push(
    http.post(eventsURL, async ({ request }) => {
      const json = await request.json();
      APIPostRequest({ url: eventsURL, json, keepalive: request.keepalive });
      return HttpResponse.json({}, { status: 200 });
    }),
  );

  const checkoutStartURL = "http://localhost:8000/rcbilling/v1/checkout/start";
  requestHandlers.push(
    http.post(checkoutStartURL, async ({ request }) => {
      const json = await request.json();
      APIPostRequest({ url: checkoutStartURL, json });
      return HttpResponse.json(checkoutStartResponse, { status: 200 });
    }),
  );

  const virtualCurrenciesURLWith3Currencies =
    "http://localhost:8000/v1/subscribers/test-app-user-id-with-3-currencies/virtual_currencies";
  requestHandlers.push(
    http.get(virtualCurrenciesURLWith3Currencies, async () => {
      APIGetRequest({ url: virtualCurrenciesURLWith3Currencies });
      return HttpResponse.json(getVirtualCurrenciesResponseWith3Currencies, {
        status: 200,
      });
    }),
  );

  const virtualCurrenciesURLWith0Currencies =
    "http://localhost:8000/v1/subscribers/test-app-user-id-with-0-currencies/virtual_currencies";
  requestHandlers.push(
    http.get(virtualCurrenciesURLWith0Currencies, async () => {
      APIGetRequest({ url: virtualCurrenciesURLWith0Currencies });
      return HttpResponse.json(getVirtualCurrenciesResponseWithNoCurrencies, {
        status: 200,
      });
    }),
  );

  const identify = "http://localhost:8000/v1/subscribers/identify";
  requestHandlers.push(
    http.post(identify, async ({ request }) => {
      const json = await request.json();
      APIPostRequest({ url: identify, json });
      return HttpResponse.json(customerInfoResponse, { status: 200 });
    }),
  );

  return requestHandlers;
}
