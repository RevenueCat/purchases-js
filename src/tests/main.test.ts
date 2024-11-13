import { describe, expect, test } from "vitest";
import {
  type CustomerInfo,
  type EntitlementInfo,
  AppUserIDProvider,
  Purchases,
  PurchasesError,
} from "../main";
import { UninitializedPurchasesError } from "../entities/errors";
import {
  configurePurchases,
  testApiKey,
  testUserId,
} from "./base.purchases_test";

describe("Purchases.configure()", () => {
  test("throws error if given invalid api key", () => {
    expect(() => Purchases.configure("goog_api_key", "appUserId")).toThrowError(
      PurchasesError,
    );
    expect(() =>
      Purchases.configure("rcb_test invalidchar", "appUserId"),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid user id", () => {
    expect(() => Purchases.configure(testApiKey, "")).toThrowError(
      PurchasesError,
    );
    expect(() =>
      Purchases.configure(testApiKey, "some/AppUserId"),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given invalid proxy url", () => {
    expect(() =>
      Purchases.configure(testApiKey, testUserId, {
        proxyURL: "https://test.revenuecat.com/",
      }),
    ).toThrowError(PurchasesError);
  });

  test("throws error if given reserved additional header", () => {
    expect(() =>
      Purchases.configure(testApiKey, testUserId, {
        additionalHeaders: { "X-Version": "123" },
      }),
    ).toThrowError(PurchasesError);
  });

  test("configures successfully", () => {
    const purchases = Purchases.configure(testApiKey, testUserId);
    expect(purchases).toBeDefined();
  });

  test("configure multiple times returns different instances", () => {
    const purchases = Purchases.configure(testApiKey, testUserId);
    const purchases2 = Purchases.configure(
      "rcb_another_api_key",
      "another_user_id",
    );
    expect(purchases).not.toEqual(purchases2);
  });

  test("can configure with RevenueCat-managed ids", () => {
    const purchases = Purchases.configure(testApiKey, {
      appUserIDsAreProvidedBy: AppUserIDProvider.RevenueCat,
    });
    const userId = purchases.getAppUserId();
    expect(userId).toMatch(/^\$RCAnonymousID:[a-f0-9]{32}$/);
  });

  test("anonymous ids are unique", () => {
    const purchases1 = Purchases.configure(testApiKey, {
      appUserIDsAreProvidedBy: AppUserIDProvider.RevenueCat,
    });
    const purchases2 = Purchases.configure(testApiKey, {
      appUserIDsAreProvidedBy: AppUserIDProvider.RevenueCat,
    });
    expect(purchases1.getAppUserId()).not.toEqual(purchases2.getAppUserId());
  });

  test("can configure with RevenueCat-managed ids and custom HTTP config", () => {
    const purchases = Purchases.configure(
      testApiKey,
      {
        appUserIDsAreProvidedBy: AppUserIDProvider.RevenueCat,
      },
      {
        proxyURL: "https://test.revenuecat.com/",
        additionalHeaders: { "Custom-Header": "value" },
      },
    );
    const userId = purchases.getAppUserId();
    expect(userId).toMatch(/^\$RCAnonymousID:[a-f0-9]{32}$/);
  });
});

describe("Purchases.isConfigured()", () => {
  test("returns false if not configured", () => {
    expect(Purchases.isConfigured()).toBeFalsy();
  });

  test("returns true if configured", () => {
    Purchases.configure(testApiKey, testUserId);
    expect(Purchases.isConfigured()).toBeTruthy();
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
  test("can change user", () => {
    const newAppUserId = "newAppUserId";
    const purchases = configurePurchases();
    expect(purchases.getAppUserId()).toEqual(testUserId);
    purchases.changeUser(newAppUserId);
    expect(purchases.getAppUserId()).toEqual(newAppUserId);
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
    store: "rc_billing",
    unsubscribeDetectedAt: null,
    willRenew: true,
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
          store: "rc_billing",
          unsubscribeDetectedAt: null,
          willRenew: true,
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
    },
    managementURL: "https://test-management-url.revenuecat.com",
    originalAppUserId: "someAppUserId",
    requestDate: new Date("2024-01-22T13:23:07Z"),
    firstSeenDate: new Date("2023-11-20T16:48:29Z"),
    originalPurchaseDate: null,
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
});

describe("Purchases.preload()", () => {
  test("can initialize without failing", async () => {
    const purchases = configurePurchases();
    await purchases.preload();
  });
});
