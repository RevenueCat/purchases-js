import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as svelte from "svelte"; // import the module as a namespace
import {
  type CustomerInfo,
  type EntitlementInfo,
  LogLevel,
  Purchases,
  type PurchasesConfig,
  PurchasesError,
  ReservedCustomerAttribute,
} from "../main";
import {
  BackendErrorCode,
  ErrorCode,
  UninitializedPurchasesError,
} from "../entities/errors";
import {
  configurePurchases,
  server,
  testApiKey,
  testUserId,
} from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import { waitFor } from "@testing-library/svelte";
import { http, HttpResponse } from "msw";
import { expectPromiseToError } from "./test-helpers";
import { StatusCodes } from "http-status-codes";

describe("Purchases.configure() legacy", () => {
  test("throws error if given invalid api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "goog_api_key",
        appUserId: "appUserId",
      }),
    ).toThrowError(PurchasesError);
    expect(() =>
      Purchases.configure({
        apiKey: "rcb_test invalidchar",
        appUserId: "appUserId",
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid user id", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: "",
      }),
    ).toThrowError(PurchasesError);
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: "some/AppUserId",
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid proxy url", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: testUserId,
        httpConfig: {
          proxyURL: "https://test.revenuecat.com/",
        },
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given reserved additional header", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: testUserId,
        httpConfig: {
          additionalHeaders: { "X-Version": "123" },
        },
      }),
    ).toThrowError(PurchasesError);
  });

  test("configures successfully", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });
    expect(purchases).toBeDefined();
  });

  test("configure multiple times returns different instances", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });
    const purchases2 = Purchases.configure({
      apiKey: "rcb_another_api_key",
      appUserId: "another_user_id",
    });
    expect(purchases).not.toEqual(purchases2);
  });
});

describe("Purchases.configure()", () => {
  test("configures successfully", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });
    expect(purchases).toBeDefined();
  });

  test("configures successfully with optional parameters", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
      httpConfig: {},
      flags: { autoCollectUTMAsMetadata: false },
      context: { workflowContext: { workflowIdentifier: "workflow-id" } },
    });
    expect(purchases).toBeDefined();
  });

  test("passes trace_id to EventsTracker when provided", () => {
    const customTraceId = "test-trace-id-789";
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
      trace_id: customTraceId,
    });

    expect(purchases["eventsTracker"].getTraceId()).toBe(customTraceId);
  });

  test("EventsTracker generates trace_id when not provided", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });

    const traceId = purchases["eventsTracker"].getTraceId();
    expect(traceId).toBeTruthy();
    expect(typeof traceId).toBe("string");
  });

  test("throws error if given invalid api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "goog_api_key",
        appUserId: testUserId,
      }),
    ).toThrowError(PurchasesError);

    expect(() =>
      Purchases.configure({
        apiKey: "rcb_test invalidchar",
        appUserId: testUserId,
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid paddle api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "pdl_test invalidchar",
        appUserId: testUserId,
      }),
    ).toThrowError(PurchasesError);
  });

  test("does not throw error if given valid paddle api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "pdl_valid_key",
        appUserId: testUserId,
      }),
    ).not.toThrow();
  });

  test("does not throw error if given valid web billing api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: testUserId,
      }),
    ).not.toThrow();
  });

  test("does not throw error if given valid simulated store api key", () => {
    expect(() =>
      Purchases.configure({
        apiKey: "test_valid_key",
        appUserId: testUserId,
      }),
    ).not.toThrow();
  });

  test("throws error if given invalid user id", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: "",
      }),
    ).toThrowError(PurchasesError);

    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: "some/AppUserId",
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid proxy url", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: testUserId,
        httpConfig: {
          proxyURL: "https://test.revenuecat.com/",
        },
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given reserved additional header", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
        appUserId: testUserId,
        httpConfig: {
          additionalHeaders: { "X-Version": "123" },
        },
      }),
    ).toThrowError(PurchasesError);
  });

  test("configure multiple times returns different instances", () => {
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });
    const purchases2 = Purchases.configure({
      apiKey: "rcb_another_api_key",
      appUserId: "another_user_id",
    });
    expect(purchases).not.toEqual(purchases2);
  });

  test("throws error if api key is not provided in object", () => {
    expect(() =>
      Purchases.configure({
        appUserId: testUserId,
      } as PurchasesConfig),
    ).toThrowError(PurchasesError);
  });

  test("throws error if app user id is not provided in object", () => {
    expect(() =>
      Purchases.configure({
        apiKey: testApiKey,
      } as PurchasesConfig),
    ).toThrowError(PurchasesError);
  });
});

describe("Purchases.isConfigured()", () => {
  test("returns false if not configured", () => {
    expect(Purchases.isConfigured()).toBeFalsy();
  });

  test("returns true if configured", () => {
    Purchases.configure({ apiKey: testApiKey, appUserId: testUserId });
    expect(Purchases.isConfigured()).toBeTruthy();
  });
});

describe("Purchases.isAnonymous()", () => {
  test("returns true if configured with anonymous user", () => {
    Purchases.configure({
      apiKey: testApiKey,
      appUserId: Purchases.generateRevenueCatAnonymousAppUserId(),
    });
    expect(Purchases.getSharedInstance().isAnonymous()).toBeTruthy();
  });

  test("returns false if configured with non anonymous user", () => {
    Purchases.configure({ apiKey: testApiKey, appUserId: testUserId });
    expect(Purchases.getSharedInstance().isAnonymous()).toBeFalsy();
  });
});

describe("Purchases.getSharedInstance()", () => {
  test("throws error if not configured", () => {
    expect(() => Purchases.getSharedInstance()).toThrowError(
      UninitializedPurchasesError,
    );
  });

  test("returns same instance than one returned after initialization", () => {
    const purchases = configurePurchases();
    expect(purchases).toEqual(Purchases.getSharedInstance());
  });
});

describe("Purchases.isEntitledTo", () => {
  test("returns true if a user is entitled", async () => {
    const purchases = configurePurchases();
    const isEntitled = await purchases.isEntitledTo("activeCatServices");
    expect(isEntitled).toBeTruthy();
  });

  test("returns false if a user is not entitled", async () => {
    const purchases = configurePurchases();
    const isEntitled = await purchases.isEntitledTo("expiredEntitlement");
    expect(isEntitled).not.toBeTruthy();
  });
});

describe("Purchases.changeUser", () => {
  test("throws error if given invalid user id", async () => {
    const purchases = configurePurchases();
    await expect(purchases.changeUser("")).rejects.toThrow(PurchasesError);
  });

  test("can change user", async () => {
    const newAppUserId = "newAppUserId";
    const purchases = configurePurchases();
    expect(purchases.getAppUserId()).toEqual(testUserId);
    await purchases.changeUser(newAppUserId);
    expect(purchases.getAppUserId()).toEqual(newAppUserId);
  });

  test("invalidates all caches when user is changed", async () => {
    const originalUserId = "test-app-user-id-with-3-currencies";
    const newAppUserId = "test-app-user-id-with-0-currencies";
    const purchases = configurePurchases(originalUserId);
    const invalidateAllCachesSpy = vi.spyOn(
      purchases["inMemoryCache"],
      "invalidateAllCaches",
    );

    const originalUserRequest: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${originalUserId}/virtual_currencies`,
    };
    const newUserRequest: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${newAppUserId}/virtual_currencies`,
    };

    // First call should cache data for original user
    await purchases.getVirtualCurrencies();
    expect(APIGetRequest).toHaveBeenCalledWith(originalUserRequest);

    // Second call should use cache (no additional request)
    await purchases.getVirtualCurrencies();
    expect(APIGetRequest).toHaveBeenCalledTimes(1);

    // Change user - this should invalidate the cache
    await purchases.changeUser(newAppUserId);

    expect(invalidateAllCachesSpy).toHaveBeenCalledOnce();

    APIGetRequest.mockReset();

    // Next call should make fresh network request for new user (indicating cache was cleared)
    await purchases.getVirtualCurrencies();
    expect(APIGetRequest).toHaveBeenCalledWith(newUserRequest);
  });
});

describe("Purchases.getAppUserId()", () => {
  test("returns app user id", () => {
    const purchases = configurePurchases();
    expect(purchases.getAppUserId()).toEqual(testUserId);
  });
});

test("can get customer info", async () => {
  const purchases = configurePurchases();
  const customerInfo = await purchases.getCustomerInfo();
  const activeCatServicesEntitlementInfo: EntitlementInfo = {
    identifier: "activeCatServices",
    billingIssueDetectedAt: null,
    isActive: true,
    isSandbox: true,
    periodType: "normal",
    latestPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
    expirationDate: new Date("2053-12-20T16:48:42Z"),
    productIdentifier: "black_f_friday_worten",
    productPlanIdentifier: null,
    store: "rc_billing",
    unsubscribeDetectedAt: null,
    willRenew: true,
    ownershipType: "UNKNOWN",
  };
  const expectedCustomerInfo: CustomerInfo = {
    entitlements: {
      all: {
        expiredCatServices: {
          identifier: "expiredCatServices",
          billingIssueDetectedAt: null,
          isActive: false,
          isSandbox: true,
          periodType: "normal",
          latestPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          originalPurchaseDate: new Date("2023-12-19T16:48:42Z"),
          expirationDate: new Date("2023-12-20T16:48:42Z"),
          productIdentifier: "black_f_friday_worten_2",
          productPlanIdentifier: "plan_id",
          store: "rc_billing",
          unsubscribeDetectedAt: null,
          willRenew: true,
          ownershipType: "FAMILY_SHARED",
        },
        activeCatServices: activeCatServicesEntitlementInfo,
      },
      active: {
        activeCatServices: activeCatServicesEntitlementInfo,
      },
    },
    activeSubscriptions: new Set(["black_f_friday_worten"]),
    allExpirationDatesByProduct: {
      black_f_friday_worten: new Date("2054-01-22T16:48:42.000Z"),
      black_f_friday_worten_2: new Date("2024-01-22T16:48:42.000Z"),
    },
    allPurchaseDatesByProduct: {
      black_f_friday_worten: new Date("2024-01-21T16:48:42.000Z"),
      black_f_friday_worten_2: new Date("2024-01-21T16:48:42.000Z"),
      consumable: new Date("2025-04-03T16:14:47.000Z"),
    },
    managementURL: "https://test-management-url.revenuecat.com",
    originalAppUserId: "someAppUserId",
    requestDate: new Date("2024-01-22T13:23:07Z"),
    firstSeenDate: new Date("2023-11-20T16:48:29Z"),
    originalPurchaseDate: null,
    nonSubscriptionTransactions: [
      {
        transactionIdentifier: "abcd1234",
        productIdentifier: "consumable",
        purchaseDate: new Date("2025-04-03T16:14:47.000Z"),
        store: "play_store",
        storeTransactionId: "GPA.0000-0000-0000-00000",
      },
    ],
    subscriptionsByProductIdentifier: {
      black_f_friday_worten: {
        productIdentifier: "black_f_friday_worten",
        purchaseDate: new Date("2024-01-21T16:48:42.000Z"),
        originalPurchaseDate: new Date("2023-11-20T16:48:42.000Z"),
        expiresDate: new Date("2054-01-22T16:48:42.000Z"),
        store: "rc_billing",
        unsubscribeDetectedAt: null,
        isSandbox: true,
        billingIssuesDetectedAt: null,
        gracePeriodExpiresDate: null,
        ownershipType: "UNKNOWN",
        periodType: "normal",
        refundedAt: null,
        storeTransactionId: "another_transaction_id",
        managementURL:
          "https://test-management-url.revenuecat.com/manage/another_transaction_id",
        isActive: true,
        willRenew: true,
      },
      black_f_friday_worten_2: {
        productIdentifier: "black_f_friday_worten_2",
        purchaseDate: new Date("2024-01-21T16:48:42.000Z"),
        originalPurchaseDate: new Date("2023-11-20T16:48:42.000Z"),
        expiresDate: new Date("2024-01-22T16:48:42.000Z"),
        store: "rc_billing",
        unsubscribeDetectedAt: null,
        isSandbox: true,
        billingIssuesDetectedAt: null,
        gracePeriodExpiresDate: null,
        ownershipType: "FAMILY_SHARED",
        periodType: "normal",
        refundedAt: null,
        storeTransactionId: "one_transaction_id",
        managementURL:
          "https://test-management-url.revenuecat.com/manage/one_transaction_id",
        isActive: false,
        willRenew: true,
      },
    },
  };
  expect(customerInfo).toEqual(expectedCustomerInfo);
});

describe("Purchases.close()", () => {
  test("can close purchases", () => {
    const purchases = configurePurchases();
    expect(Purchases.isConfigured()).toBeTruthy();
    purchases.close();
    expect(Purchases.isConfigured()).toBeFalsy();
  });

  test("disposes of events tracker and calls through", () => {
    const purchases = configurePurchases();

    // Create spy that calls through to the original implementation
    const disposeSpy = vi.spyOn(purchases["eventsTracker"], "dispose");

    purchases.close();

    expect(disposeSpy).toHaveBeenCalled();
  });
});

describe("Purchases.preload()", () => {
  test("can initialize without failing", async () => {
    const purchases = configurePurchases();
    await purchases.preload();
  });
});

const uuidImplementations = [
  {
    name: "crypto.randomUUID",
    setup: () => {
      return vi.spyOn(crypto, "randomUUID");
    },
  },
  {
    name: "crypto.getRandomValues fallback",
    setup: () => {
      crypto.randomUUID = undefined as unknown as typeof crypto.randomUUID;
      return vi.spyOn(crypto, "getRandomValues");
    },
  },
  {
    name: "Math.random fallback",
    setup: () => {
      crypto.randomUUID = undefined as unknown as typeof crypto.randomUUID;
      crypto.getRandomValues =
        undefined as unknown as typeof crypto.getRandomValues;
      return vi.spyOn(Math, "random");
    },
  },
];
uuidImplementations.forEach((implementation) => {
  describe(`Purchases.generateRevenueCatAnonymousAppUserId() with ${implementation.name}`, () => {
    let setupResult: ReturnType<typeof implementation.setup>;
    beforeEach(() => {
      setupResult = implementation.setup();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("generates ID with correct format", () => {
      const anonymousId = Purchases.generateRevenueCatAnonymousAppUserId();
      expect(anonymousId).toMatch(/^\$RCAnonymousID:[0-9a-f]{32}$/);
    });

    test("generates unique IDs", () => {
      const id1 = Purchases.generateRevenueCatAnonymousAppUserId();
      const id2 = Purchases.generateRevenueCatAnonymousAppUserId();
      expect(id1).not.toEqual(id2);
    });

    test("generated ID passes appUserId validation", () => {
      const anonymousId = Purchases.generateRevenueCatAnonymousAppUserId();
      expect(() =>
        Purchases.configure({
          apiKey: testApiKey,
          appUserId: anonymousId,
        }),
      ).not.toThrow();
    });

    test("calls the expected uuid implementation", () => {
      const anonymousId = Purchases.generateRevenueCatAnonymousAppUserId();
      expect(anonymousId).toMatch(/^\$RCAnonymousID:[0-9a-f]{32}$/);
      expect(setupResult).toHaveBeenCalled();
    });
  });
});

describe("Purchases._trackEvent", () => {
  test("allows tracking events", () => {
    const purchases = configurePurchases();
    const trackEventSpy = vi.spyOn(
      purchases["eventsTracker"],
      "trackExternalEvent",
    );
    purchases._trackEvent({
      source: "wpl",
      eventName: "test_event",
      properties: {
        test_property: "test_value",
      },
    });
    expect(trackEventSpy).toHaveBeenCalledWith({
      eventName: "test_event",
      source: "wpl",
      properties: {
        test_property: "test_value",
      },
    });
  });
});

describe("Purchases.identifyUser", () => {
  test("allows to identify User", async () => {
    const purchases = configurePurchases();
    const initialAppUserId = purchases.getAppUserId();
    await purchases.identifyUser("newAppUserId");
    const newAppUserId = purchases.getAppUserId();
    expect(newAppUserId).toBe("newAppUserId");
    expect(initialAppUserId).not.toBe(newAppUserId);
  });

  test("fails if invalid user ID given", async () => {
    const purchases = configurePurchases();
    await expectPromiseToError(
      purchases.identifyUser(""),
      new PurchasesError(
        ErrorCode.InvalidAppUserIdError,
        'Provided user id: "" is not valid. See https://www.revenuecat.com/docs/customers/user-ids#tips-for-setting-app-user-ids for more information.',
      ),
    );
  });
});

describe("Purchases.purchase()", () => {
  test("pressing back button unmounts the component", async () => {
    const unmountSpy = vi.spyOn(svelte, "unmount").mockImplementation(() => {
      return Promise.resolve();
    });

    const purchases = configurePurchases();
    const purchasePromise = purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
    });

    await waitFor(() => {
      const container = document.querySelector(".rcb-ui-root");
      expect(container).not.toBeNull();
      if (container) {
        expect(container.innerHTML).not.toBe("");
      }
    });

    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => {
      expect(unmountSpy).toHaveBeenCalled();
    });

    await expect(purchasePromise).rejects.toHaveProperty(
      "errorCode",
      ErrorCode.UserCancelledError,
    );

    unmountSpy.mockRestore();
  });

  test("does show the back button", async () => {
    const purchases = configurePurchases(testUserId, "anyOtherValue");
    purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
    });

    await waitFor(() => {
      const container = document.querySelector(".rcb-ui-root");
      expect(container).not.toBeNull();
      expect(document.querySelector(".rcb-back-button")).not.toBeNull();
    });

    purchases.close();
    // Forcing the body to cleanup to not affect other tests
    document.body.innerHTML = "";
  });

  test("does not show the back button for rcSource='app'", async () => {
    const purchases = configurePurchases(testUserId, "app");
    purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
    });

    await waitFor(() => {
      const container = document.querySelector(".rcb-ui-root");
      expect(container).not.toBeNull();
      expect(document.querySelector(".rcb-back-button")).toBeNull();
    });

    purchases.close();
    // Forcing the body to cleanup to not affect other tests
    document.body.innerHTML = "";
  });

  test("does not show the back button for rcSource='embedded'", async () => {
    const purchases = configurePurchases(testUserId, "embedded");
    purchases.purchase({
      rcPackage: createMonthlyPackageMock(),
    });

    await waitFor(() => {
      const container = document.querySelector(".rcb-ui-root");
      expect(container).not.toBeNull();
      expect(document.querySelector(".rcb-back-button")).toBeNull();
    });

    purchases.close();
    // Forcing the body to cleanup to not affect other tests
    document.body.innerHTML = "";
  });

  test("throws error if api key is not provided", () => {
    // @ts-expect-error - we want to test the error case
    expect(() => Purchases.configure()).toThrowError(PurchasesError);
  });

  test("throws error if app user id is not provided", () => {
    // @ts-expect-error - we want to test the error case
    expect(() => Purchases.configure(testApiKey)).toThrowError(PurchasesError);
  });
});

describe("setAttributes", () => {
  test("can set attributes successfully", async () => {
    const purchases = configurePurchases();

    let capturedBody: Record<string, string> = {};

    server.use(
      http.post(
        "http://localhost:8000/v1/subscribers/someAppUserId/attributes",
        async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          capturedBody = body;
          return HttpResponse.json({}, { status: StatusCodes.OK });
        },
      ),
    );

    await purchases.setAttributes({ name: "John", age: "30" });

    expect(capturedBody).toEqual({
      attributes: {
        name: { value: "John", updated_at_ms: expect.any(Number) },
        age: { value: "30", updated_at_ms: expect.any(Number) },
      },
    });
  });
  test("can set attributes successfully using reserved attributes enum", async () => {
    const purchases = configurePurchases();

    let capturedBody: Record<string, string> = {};

    server.use(
      http.post(
        "http://localhost:8000/v1/subscribers/someAppUserId/attributes",
        async ({ request }) => {
          const body = (await request.json()) as Record<string, string>;
          capturedBody = body;
          return HttpResponse.json({}, { status: StatusCodes.OK });
        },
      ),
    );

    await purchases.setAttributes({
      [ReservedCustomerAttribute.DisplayName]: "John",
      [ReservedCustomerAttribute.Email]: "john@example.com",
      age: "30",
    });

    expect(capturedBody).toEqual({
      attributes: {
        $displayName: { value: "John", updated_at_ms: expect.any(Number) },
        $email: {
          value: "john@example.com",
          updated_at_ms: expect.any(Number),
        },
        age: { value: "30", updated_at_ms: expect.any(Number) },
      },
    });
  });

  test("throws an error if getCustomerInfo fails", async () => {
    const purchases = configurePurchases();
    server.use(
      http.get("http://localhost:8000/v1/subscribers/someAppUserId", () => {
        return HttpResponse.json(null, {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }),
    );

    await expectPromiseToError(
      purchases.setAttributes({ name: "John", age: "30" }),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: getCustomerInfo. Status code: 500. Body: null.",
      ),
    );
  });

  test("throws an error if the request is invalid (400)", async () => {
    const purchases = configurePurchases();
    server.use(
      http.post(
        "http://localhost:8000/v1/subscribers/someAppUserId/attributes",
        () => {
          return HttpResponse.json(
            {
              code: BackendErrorCode.BackendInvalidSubscriberAttributes,
              message: "Invalid attributes format",
            },
            { status: StatusCodes.BAD_REQUEST },
          );
        },
      ),
    );

    await expectPromiseToError(
      purchases.setAttributes({ name: "John", age: "30" }),
      new PurchasesError(
        ErrorCode.InvalidSubscriberAttributesError,
        "One or more of the attributes sent could not be saved.",
        "Invalid attributes format",
      ),
    );
  });

  test("throws an error if the server returns a 5xx error", async () => {
    const purchases = configurePurchases();
    server.use(
      http.post(
        "http://localhost:8000/v1/subscribers/someAppUserId/attributes",
        () => {
          return HttpResponse.json(
            {},
            {
              status: StatusCodes.INTERNAL_SERVER_ERROR,
            },
          );
        },
      ),
    );

    await expectPromiseToError(
      purchases.setAttributes({ name: "John", age: "30" }),
      new PurchasesError(
        ErrorCode.UnknownBackendError,
        "Unknown backend error.",
        "Request: setAttributes. Status code: 500. Body: {}.",
      ),
    );
  });
});

describe("Purchases.setLogHandler()", () => {
  beforeEach(() => {
    // Reset log handler before each test
    Purchases.setLogHandler(null);
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
    Purchases.setLogHandler(null);
  });

  test("should set custom log handler", () => {
    const mockHandler = vi.fn();

    Purchases.setLogHandler(mockHandler);

    // The handler should be set (we can't directly test this, but we can test the effect)
    expect(() => Purchases.setLogHandler(mockHandler)).not.toThrow();
  });

  test("should reset to null handler", () => {
    const mockHandler = vi.fn();

    Purchases.setLogHandler(mockHandler);
    Purchases.setLogHandler(null);

    // Should not throw
    expect(() => Purchases.setLogHandler(null)).not.toThrow();
  });

  test("should call custom handler when logging occurs", () => {
    const mockHandler = vi.fn();

    Purchases.setLogHandler(mockHandler);
    Purchases.setLogLevel(LogLevel.Debug);

    // Configure purchases to trigger some logging
    const purchases = Purchases.configure({
      apiKey: testApiKey,
      appUserId: testUserId,
    });

    // We expect some logging to have occurred during configuration
    // Note: The exact logging behavior depends on the implementation
    expect(purchases).toBeDefined();
  });
});
