import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { waitFor } from "@testing-library/svelte";
import { mount, unmount } from "svelte";
import type * as Svelte from "svelte";
import { Purchases, type PurchaseResult } from "../main";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { Backend } from "../networking/backend";
import { brandingInfo } from "../stories/fixtures";
import { createMonthlyPackageMock } from "./mocks/offering-mock-provider";
import type { OperationSessionSuccessfulResult } from "../helpers/purchase-operation-helper";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../helpers/purchase-operation-helper";
import type { SubscriberResponse } from "../networking/responses/subscriber-response";

vi.mock("svelte", async () => {
  const actual = await vi.importActual<typeof Svelte>("svelte");
  return {
    ...actual,
    mount: vi.fn(() => ({})),
    unmount: vi.fn().mockResolvedValue(undefined),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("Network prohibited in reproduction"),
  );
  vi.spyOn(Backend.prototype, "getBrandingInfo").mockResolvedValue(
    brandingInfo,
  );
});
afterEach(() => {
  if (Purchases.isConfigured()) Purchases.getSharedInstance().close();
  expect(globalThis.fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

const response: SubscriberResponse = {
  request_date: "2026-10-06T12:00:00Z",
  request_date_ms: Date.parse("2026-10-06T12:00:00Z"),
  subscriber: {
    entitlements: {},
    first_seen: "2026-10-06T12:00:00Z",
    management_url: null,
    non_subscriptions: {},
    original_app_user_id: "user-A",
    original_application_version: null,
    original_purchase_date: null,
    subscriptions: {},
  },
};
const completed: OperationSessionSuccessfulResult = {
  redemptionInfo: null,
  operationSessionId: "mock-session",
  storeTransactionIdentifier: "mock-transaction",
  productIdentifier: "monthly",
  purchaseDate: new Date("2026-10-06T12:00:00Z"),
};
type Callbacks = {
  onFinished: (result: OperationSessionSuccessfulResult) => Promise<void>;
  onError: (error: PurchaseFlowError) => void;
};

async function start(apiKey: string) {
  const purchases = Purchases.configure({
    apiKey,
    appUserId: "user-A",
    flags: { collectAnalyticsEvents: false, autoCollectUTMAsMetadata: false },
  });
  const target = document.createElement("div");
  document.body.append(target);
  const purchase = purchases.purchase({
    rcPackage: createMonthlyPackageMock(),
    htmlTarget: target,
  });
  let status = "pending";
  let result: PurchaseResult | undefined;
  let error: unknown;
  void purchase.then(
    (value) => {
      status = "resolved";
      result = value;
    },
    (reason: unknown) => {
      status = "rejected";
      error = reason;
    },
  );
  await waitFor(() => expect(mount).toHaveBeenCalledTimes(1));
  const callbacks = vi.mocked(mount).mock.calls[0][1]
    .props as unknown as Callbacks;
  return { purchase, callbacks, observed: () => ({ status, result, error }) };
}

describe("purchase promise settlement after successful checkout", () => {
  test.each(["rcb_sb_test_api_key", "strp_test_api_key", "pdl_test_api_key"])(
    "rejects the purchase if customer info fails after completion: %s",
    async (apiKey) => {
      const cause = new PurchasesError(
        ErrorCode.NetworkError,
        "distinctive mocked post-payment customer-info failure",
      );
      const getInfo = vi
        .spyOn(Backend.prototype, "getCustomerInfo")
        .mockRejectedValue(cause);
      const state = await start(apiKey);
      // Catch the async callback rejection so the test runner itself has no
      // unhandled rejection; the real UI drops this callback's returned promise.
      const callbackError = await state.callbacks
        .onFinished(completed)
        .catch((error: unknown) => error);
      expect(getInfo).toHaveBeenCalledExactlyOnceWith("user-A");
      expect(unmount).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(state.observed().status).toBe("rejected"));
      expect(state.observed().error).toBe(cause);
      expect(callbackError).toBeUndefined();
      await expect(state.purchase).rejects.toBe(cause);
    },
  );

  test("control: successful customer-info fetch resolves the purchase", async () => {
    vi.spyOn(Backend.prototype, "getCustomerInfo").mockResolvedValue(response);
    const state = await start("rcb_sb_test_api_key");
    await state.callbacks.onFinished(completed);
    const result = await state.purchase;
    expect(result.operationSessionId).toBe("mock-session");
    expect(result.customerInfo.originalAppUserId).toBe("user-A");
    expect(state.observed().status).toBe("resolved");
  });

  test("control: the ordinary checkout error path rejects the purchase", async () => {
    vi.spyOn(Backend.prototype, "getCustomerInfo").mockResolvedValue(response);
    const state = await start("rcb_sb_test_api_key");
    state.callbacks.onError(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.NetworkError,
        "mocked checkout failure",
      ),
    );
    await expect(state.purchase).rejects.toThrow();
    expect(state.observed().status).toBe("rejected");
  });
});
