import { http, HttpResponse, RequestHandler } from "msw";

const monthlyProductResponse = {
  current_price: {
    amount: 300,
    currency: "USD",
  },
  identifier: "monthly",
  normal_period_duration: "PT1H",
  product_type: "subscription",
  title: "Monthly test",
};

const monthly2ProductResponse = {
  current_price: {
    amount: 500,
    currency: "USD",
  },
  identifier: "monthly_2",
  normal_period_duration: "PT1H",
  product_type: "subscription",
  title: "Monthly test 2",
};

const productsResponse = {
  product_details: [monthlyProductResponse, monthly2ProductResponse],
};

const offeringsArray = [
  {
    identifier: "offering_1",
    description: "Offering 1",
    metadata: null,
    packages: [
      {
        identifier: "package_1",
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

const customerInfoResponse = {
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

const offeringsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: {
    current_offering_id: "offering_1",
    offerings: offeringsArray,
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

const entitlementsResponsesPerUserId: { [userId: string]: object } = {
  someAppUserId: {
    entitlements: [
      {
        created_at: 1699890475771,
        display_name: "Some Entitlement Name",
        id: "ent12345",
        lookup_key: "someEntitlement",
        object: "entitlement",
        project_id: "proj12345",
      },
    ],
  },
  someOtherAppUserId: { entitlements: [] },
};

const customerInfoResponsePerUserId: { [userId: string]: object } = {
  someAppUserId: customerInfoResponse,
};

export function getEntitlementsResponseHandlers(): RequestHandler[] {
  const requestHandlers: RequestHandler[] = [];
  Object.keys(entitlementsResponsesPerUserId).forEach((userId: string) => {
    const body = entitlementsResponsesPerUserId[userId]!;
    requestHandlers.push(
      http.get(
        `http://localhost:8000/rcbilling/v1/entitlements/${userId}`,
        () => {
          return HttpResponse.json(body, { status: 200 });
        },
      ),
    );
  });
  return requestHandlers;
}

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

  requestHandlers.push(...getEntitlementsResponseHandlers());

  return requestHandlers;
}
