import { http, HttpResponse, type RequestHandler } from "msw";
import type { OfferingsResponse } from "../networking/responses/offerings-response";

const monthlyProductResponse = {
  current_price: {
    amount_micros: 3000000,
    currency: "USD",
  },
  identifier: "monthly",
  normal_period_duration: "P1M",
  product_type: "subscription",
  title: "Monthly test",
  description: null,
  default_subscription_option_id: "base_option",
  subscription_options: {
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

const monthly2ProductResponse = {
  current_price: {
    amount_micros: 5000000,
    currency: "USD",
  },
  identifier: "monthly_2",
  normal_period_duration: "P1M",
  product_type: "subscription",
  title: "Monthly test 2",
  description: "monthly description",
  default_subscription_option_id: "offer_12345",
  subscription_options: {
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

export const productsResponse = {
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
};

const productsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: productsResponse,
  appUserIdWithoutCurrentOfferingId: productsResponse,
  appUserIdWithMissingProducts: { product_details: [monthlyProductResponse] },
};

const customerInfoResponsePerUserId: { [userId: string]: object } = {
  someAppUserId: customerInfoResponse,
  newAppUserId: newAppUserIdCustomerInfoResponse,
};

export function getRequestHandlers(): RequestHandler[] {
  const requestHandlers: RequestHandler[] = [];
  Object.keys(offeringsResponsesPerUserId).forEach((userId: string) => {
    const body = offeringsResponsesPerUserId[userId]!;
    requestHandlers.push(
      http.get(
        `http://localhost:8000/v1/subscribers/${userId}/offerings`,
        () => {
          return HttpResponse.json(body, { status: 200 });
        },
      ),
    );
  });

  Object.keys(productsResponsesPerUserId).forEach((userId: string) => {
    const body = productsResponsesPerUserId[userId]!;
    requestHandlers.push(
      http.get(
        `http://localhost:8000/rcbilling/v1/subscribers/${userId}/products?id=monthly&id=monthly_2`,
        () => {
          return HttpResponse.json(body, { status: 200 });
        },
      ),
    );
  });

  Object.keys(customerInfoResponsePerUserId).forEach((userId: string) => {
    const body = customerInfoResponsePerUserId[userId]!;
    requestHandlers.push(
      http.get(`http://localhost:8000/v1/subscribers/${userId}`, () => {
        return HttpResponse.json(body, { status: 200 });
      }),
    );
  });

  return requestHandlers;
}
