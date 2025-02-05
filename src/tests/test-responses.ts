import { http, HttpResponse, type RequestHandler } from "msw";
import type { OfferingsResponse } from "../networking/responses/offerings-response";
import { vi } from "vitest";
import type {
  ProductResponse,
  ProductsResponse,
} from "../networking/responses/products-response";
import type { CheckoutStartResponse } from "../networking/responses/checkout-start-response";
import type { CheckoutCompleteResponse } from "../networking/responses/checkout-complete-response";

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
    },
  },
};

export const productsResponse: ProductsResponse = {
  product_details: [monthlyProductResponse, monthly2ProductResponse],
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

export const customerInfoResponse = {
  request_date: "2024-01-22T13:23:07Z",
  request_date_ms: 1705929787636,
  subscriber: {
    entitlements: {
      expiredCatServices: {
        expires_date: "2023-12-20T16:48:42Z",
        grace_period_expires_date: null,
        product_identifier: "black_f_friday_worten_2",
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
    non_subscriptions: {},
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
        original_purchase_date: "2023-11-20T16:48:42Z",
        period_type: "normal",
        purchase_date: "2024-01-21T16:48:42Z",
        refunded_at: null,
        store: "rc_billing",
        store_transaction_id: "one_transaction_id",
        unsubscribe_detected_at: null,
      },
      black_f_friday_worten: {
        auto_resume_date: null,
        billing_issues_detected_at: null,
        expires_date: "2054-01-22T16:48:42Z",
        grace_period_expires_date: null,
        is_sandbox: true,
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
};

const productsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: productsResponse,
  appUserIdWithoutCurrentOfferingId: productsResponse,
  appUserIdWithMissingProducts: { product_details: [monthlyProductResponse] },
  appUserIdWithNonSubscriptionProducts: {
    product_details: [consumableProductResponse],
  },
};

const customerInfoResponsePerUserId: { [userId: string]: object } = {
  someAppUserId: customerInfoResponse,
  newAppUserId: newAppUserIdCustomerInfoResponse,
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
  data: {
    stripe_account_id: "test-stripe-account-id",
    publishable_api_key: "test-publishable-api-key",
  },
};

export const checkoutCompleteResponse: CheckoutCompleteResponse = {
  operation_session_id: "test-operation-session-id",
  data: {
    stripe_account_id: "test-stripe-account-id",
    publishable_api_key: "test-publishable-api-key",
    client_secret: "test-client-secret",
  },
};

export interface GetRequest {
  url: string;
}

export const APIGetRequest = vi.fn();

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

  return requestHandlers;
}
