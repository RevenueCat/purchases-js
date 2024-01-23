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

  requestHandlers.push(
    http.post("http://localhost:8000/rcbilling/v1/subscribe", () => {
      return HttpResponse.json(
        {
          next_action: "collect_payment_info",
          data: {
            client_secret: "seti_123",
          },
        },
        { status: 200 },
      );
    }),
  );

  return requestHandlers;
}
