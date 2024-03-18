import { describe, expect, test } from "vitest";
import { type SubscriberResponse } from "../networking/responses/subscriber-response";
import { type CustomerInfo, toCustomerInfo } from "../entities/customer-info";

describe("customer info parsing", () => {
  test("subscriber info with no purchases is parsed correctly", () => {
    const subscriberResponse: SubscriberResponse = {
      request_date: "2024-01-31T15:08:05Z",
      request_date_ms: 1706713685064,
      subscriber: {
        entitlements: {},
        first_seen: "2024-01-23T13:22:12Z",
        last_seen: "2024-01-24T16:12:11Z",
        management_url: null,
        non_subscriptions: {},
        original_app_user_id: "someUserTestToni6",
        original_application_version: null,
        original_purchase_date: null,
        other_purchases: {},
        subscriptions: {},
      },
    };
    const expectedCustomerInfo: CustomerInfo = {
      activeSubscriptions: new Set(),
      allExpirationDatesByProduct: {},
      allPurchaseDatesByProduct: {},
      entitlements: {
        active: {},
        all: {},
      },
      firstSeenDate: new Date("2024-01-23T13:22:12.000Z"),
      managementURL: null,
      originalAppUserId: "someUserTestToni6",
      originalPurchaseDate: null,
      requestDate: new Date("2024-01-31T15:08:05.000Z"),
    };
    const customerInfo = toCustomerInfo(subscriberResponse);
    expect(customerInfo).toEqual(expectedCustomerInfo);
  });

  test("subscriber info with rc-billing subscription purchase is parsed correctly", () => {
    const subscriberResponse: SubscriberResponse = {
      request_date: "2024-01-31T15:10:21Z",
      request_date_ms: 1706713821860,
      subscriber: {
        entitlements: {
          catServices: {
            expires_date: "2124-02-07T13:46:23Z",
            grace_period_expires_date: null,
            product_identifier: "weekly_test",
            purchase_date: "2024-01-31T13:46:23Z",
          },
        },
        first_seen: "2024-01-23T13:22:12Z",
        last_seen: "2024-01-29T15:40:09Z",
        management_url: null,
        non_subscriptions: {},
        original_app_user_id: "someUserTestToni6",
        original_application_version: null,
        original_purchase_date: null,
        other_purchases: {},
        subscriptions: {
          weekly_test: {
            auto_resume_date: null,
            billing_issues_detected_at: null,
            expires_date: "2124-02-07T13:46:23Z",
            grace_period_expires_date: null,
            is_sandbox: true,
            original_purchase_date: "2024-01-24T13:46:23Z",
            period_type: "normal",
            purchase_date: "2024-01-31T13:46:23Z",
            refunded_at: null,
            store: "rc_billing",
            store_transaction_id:
              "txRcb1486347e9afce2143eec187a781f82e8..1706708783",
            unsubscribe_detected_at: null,
          },
        },
      },
    };
    const expectedCustomerInfo: CustomerInfo = {
      activeSubscriptions: new Set(["weekly_test"]),
      allExpirationDatesByProduct: {
        weekly_test: new Date("2124-02-07T13:46:23.000Z"),
      },
      allPurchaseDatesByProduct: {
        weekly_test: new Date("2024-01-31T13:46:23.000Z"),
      },
      entitlements: {
        active: {
          catServices: {
            billingIssueDetectedAt: null,
            expirationDate: new Date("2124-02-07T13:46:23.000Z"),
            identifier: "catServices",
            isActive: true,
            isSandbox: false,
            originalPurchaseDate: new Date("2024-01-31T13:46:23.000Z"),
            periodType: "normal",
            productIdentifier: "weekly_test",
            store: "unknown",
            unsubscribeDetectedAt: null,
            willRenew: false,
          },
        },
        all: {
          catServices: {
            billingIssueDetectedAt: null,
            expirationDate: new Date("2124-02-07T13:46:23.000Z"),
            identifier: "catServices",
            isActive: true,
            isSandbox: false,
            originalPurchaseDate: new Date("2024-01-31T13:46:23.000Z"),
            periodType: "normal",
            productIdentifier: "weekly_test",
            store: "unknown",
            unsubscribeDetectedAt: null,
            willRenew: false,
          },
        },
      },
      firstSeenDate: new Date("2024-01-23T13:22:12.000Z"),
      managementURL: null,
      originalAppUserId: "someUserTestToni6",
      originalPurchaseDate: null,
      requestDate: new Date("2024-01-31T15:10:21.000Z"),
    };
    const customerInfo = toCustomerInfo(subscriberResponse);
    expect(customerInfo).toEqual(expectedCustomerInfo);
  });

  test("subscriber info with other store subscription purchase is parsed correctly", () => {
    const subscriberResponse: SubscriberResponse = {
      request_date: "2019-08-16T10:30:42Z",
      request_date_ms: 1565951442879,
      subscriber: {
        original_app_user_id: "app_user_id",
        original_application_version: "2083",
        first_seen: "2019-06-17T16:05:33Z",
        original_purchase_date: "2019-07-26T23:30:41Z",
        non_subscriptions: {
          "100_coins_pack": [
            {
              id: "72c26cc69c",
              is_sandbox: true,
              original_purchase_date: "1990-08-30T02:40:36Z",
              purchase_date: "1990-08-30T02:40:36Z",
              store: "app_store",
            },
            {
              id: "6229b0bef1",
              is_sandbox: true,
              original_purchase_date: "2019-11-06T03:26:15Z",
              purchase_date: "2019-11-06T03:26:15Z",
              store: "play_store",
            },
          ],
          "7_extra_lives": [
            {
              id: "d6c007ba74",
              is_sandbox: true,
              original_purchase_date: "2019-07-11T18:36:20Z",
              purchase_date: "2019-07-11T18:36:20Z",
              store: "play_store",
            },
            {
              id: "5b9ba226bc",
              is_sandbox: true,
              original_purchase_date: "2019-07-26T22:10:27Z",
              purchase_date: "2019-07-26T22:10:27Z",
              store: "app_store",
            },
          ],
          lifetime_access: [
            {
              id: "b6c007ba74",
              is_sandbox: true,
              original_purchase_date: "2019-09-11T18:36:20Z",
              purchase_date: "2019-09-11T18:36:20Z",
              store: "play_store",
            },
          ],
        },
        subscriptions: {
          pro: {
            billing_issues_detected_at: null,
            is_sandbox: true,
            original_purchase_date: "2019-07-26T23:30:41Z",
            purchase_date: "2019-07-26T23:45:40Z",
            product_plan_identifier: "monthly",
            store: "app_store",
            unsubscribe_detected_at: null,
            expires_date: "2100-04-06T20:54:45.975000Z",
            period_type: "normal",
          },
          basic: {
            billing_issues_detected_at: null,
            is_sandbox: true,
            original_purchase_date: "2019-07-26T23:30:41Z",
            purchase_date: "2019-07-26T23:45:40Z",
            product_plan_identifier: "monthly",
            store: "app_store",
            unsubscribe_detected_at: null,
            period_type: "normal",
            expires_date: "1990-08-30T02:40:36Z",
          },
        },
        entitlements: {
          pro: {
            expires_date: "2100-04-06T20:54:45.975000Z",
            product_identifier: "pro",
            product_plan_identifier: "monthly",
            purchase_date: "2018-10-26T23:17:53Z",
          },
          basic: {
            expires_date: "1990-08-30T02:40:36Z",
            product_identifier: "basic",
            product_plan_identifier: "monthly",
            purchase_date: "1990-06-30T02:40:36Z",
          },
          forever_pro: {
            expires_date: null,
            product_identifier: "lifetime_access",
            purchase_date: "2019-09-11T18:36:20Z",
          },
        },
        management_url: "https://play.google.com/store/account/subscriptions",
      },
    };
    const expectedCustomerInfo: CustomerInfo = {
      activeSubscriptions: new Set(["pro"]),
      allExpirationDatesByProduct: {
        pro: new Date("2100-04-06T20:54:45.975000Z"),
        basic: new Date("1990-08-30T02:40:36Z"),
      },
      allPurchaseDatesByProduct: {
        pro: new Date("2019-07-26T23:45:40.000Z"),
        basic: new Date("2019-07-26T23:45:40.000Z"),
      },
      entitlements: {
        active: {
          forever_pro: {
            billingIssueDetectedAt: null,
            expirationDate: null,
            identifier: "forever_pro",
            isActive: true,
            isSandbox: false,
            originalPurchaseDate: new Date("2019-09-11T18:36:20.000Z"),
            periodType: "normal",
            productIdentifier: "lifetime_access",
            store: "unknown",
            unsubscribeDetectedAt: null,
            willRenew: false,
          },
          pro: {
            billingIssueDetectedAt: null,
            expirationDate: new Date("2100-04-06T20:54:45.975Z"),
            identifier: "pro",
            isActive: true,
            isSandbox: true,
            originalPurchaseDate: new Date("2018-10-26T23:17:53.000Z"),
            periodType: "normal",
            productIdentifier: "pro",
            store: "app_store",
            unsubscribeDetectedAt: null,
            willRenew: true,
          },
        },
        all: {
          basic: {
            billingIssueDetectedAt: null,
            expirationDate: new Date("1990-08-30T02:40:36.000Z"),
            identifier: "basic",
            isActive: false,
            isSandbox: true,
            originalPurchaseDate: new Date("1990-06-30T02:40:36.000Z"),
            periodType: "normal",
            productIdentifier: "basic",
            store: "app_store",
            unsubscribeDetectedAt: null,
            willRenew: true,
          },
          forever_pro: {
            billingIssueDetectedAt: null,
            expirationDate: null,
            identifier: "forever_pro",
            isActive: true,
            isSandbox: false,
            originalPurchaseDate: new Date("2019-09-11T18:36:20.000Z"),
            periodType: "normal",
            productIdentifier: "lifetime_access",
            store: "unknown",
            unsubscribeDetectedAt: null,
            willRenew: false,
          },
          pro: {
            billingIssueDetectedAt: null,
            expirationDate: new Date("2100-04-06T20:54:45.975Z"),
            identifier: "pro",
            isActive: true,
            isSandbox: true,
            originalPurchaseDate: new Date("2018-10-26T23:17:53.000Z"),
            periodType: "normal",
            productIdentifier: "pro",
            store: "app_store",
            unsubscribeDetectedAt: null,
            willRenew: true,
          },
        },
      },
      firstSeenDate: new Date("2019-06-17T16:05:33.000Z"),
      managementURL: "https://play.google.com/store/account/subscriptions",
      originalAppUserId: "app_user_id",
      originalPurchaseDate: new Date("2019-07-26T23:30:41.000Z"),
      requestDate: new Date("2019-08-16T10:30:42.000Z"),
    };
    const customerInfo = toCustomerInfo(subscriberResponse);
    expect(customerInfo).toEqual(expectedCustomerInfo);
  });
});
