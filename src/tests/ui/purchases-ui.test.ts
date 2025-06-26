import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import PurchasesUI from "../../ui/purchases-ui.svelte";
import {
  brandingInfo,
  checkoutCalculateTaxResponse,
  checkoutStartResponse,
  rcPackage,
  subscriptionOption,
} from "../../stories/fixtures";
import type { Purchases } from "../../main";
import { type PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import type { CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { CheckoutCalculateTaxResponse } from "../../networking/responses/checkout-calculate-tax-response";
import { checkoutCompleteResponse } from "../test-responses";
import type { CheckoutCompleteResponse } from "../../networking/responses/checkout-complete-response";

const eventsTrackerMock = createEventsTrackerMock();

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
  checkoutCalculateTax: async () =>
    Promise.resolve(
      checkoutCalculateTaxResponse as CheckoutCalculateTaxResponse,
    ),
  checkoutComplete: async () =>
    Promise.resolve(checkoutCompleteResponse as CheckoutCompleteResponse),
  pollCurrentPurchaseForCompletion: async () =>
    Promise.resolve({ redemptionInfo: null, operationSessionId: "op-id" }),
} as unknown as PurchaseOperationHelper;

const purchasesMock: Purchases = {
  isSandbox: () => true,
  close: vi.fn(),
} as unknown as Purchases;

const basicProps = {
  appUserId: "app-user-id",
  metadata: { utm_term: "something" },
  onFinished: vi.fn(),
  onError: vi.fn(),
  purchases: purchasesMock,
  eventsTracker: eventsTrackerMock,
  purchaseOperationHelper: purchaseOperationHelperMock,
  rcPackage: rcPackage,
  purchaseOption: subscriptionOption,
  brandingInfo: null,
  isSandbox: true,
  branding: brandingInfo,
  customerEmail: "test@test.com",
  onClose: vi.fn(),
};

describe("PurchasesUI", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("performs tax calculation when gateway_tax_collection_enabled is true", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutCalculateTax")
      .mockResolvedValue(checkoutCalculateTaxResponse);

    render(PurchasesUI, {
      props: {
        ...basicProps,
        brandingInfo: {
          ...brandingInfo,
          gateway_tax_collection_enabled: true,
        },
      },
    });

    await new Promise(process.nextTick);

    expect(calculateTaxSpy).toHaveBeenCalled();
  });

  test("does not perform tax calculation when gateway_tax_collection_enabled is false", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutCalculateTax")
      .mockResolvedValue(checkoutCalculateTaxResponse);

    render(PurchasesUI, {
      props: {
        ...basicProps,
        brandingInfo: {
          ...brandingInfo,
          gateway_tax_collection_enabled: false,
        },
      },
    });

    await new Promise(process.nextTick);

    expect(calculateTaxSpy).not.toHaveBeenCalled();
  });

  test("restores original styles when the component is unmounted", async () => {
    document.body.style.height = "100px";
    document.body.style.overflow = "scroll";

    const { unmount } = render(PurchasesUI, {
      props: {
        ...basicProps,
      },
    });

    expect(document.documentElement.style.height).toBe("100%");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.height).toBe("100%");

    unmount();
    expect(document.documentElement.style.height).toBe("");
    expect(document.body.style.height).toBe("100px");
    expect(document.body.style.overflow).toBe("scroll");
  });

  test("calls onFinished immediately when skipSuccessPage is true", async () => {
    const onFinished = vi.fn();
    const pollSpy = vi
      .spyOn(purchaseOperationHelperMock, "pollCurrentPurchaseForCompletion")
      .mockResolvedValue({ redemptionInfo: null, operationSessionId: "op-id" });

    render(PurchasesUI, {
      props: {
        ...basicProps,
        onFinished,
        skipSuccessPage: true,
      },
    });

    await new Promise(process.nextTick);

    const paymentForm = screen.getByTestId("payment-form");
    await fireEvent.submit(paymentForm);

    await new Promise(process.nextTick);

    expect(pollSpy).toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledWith("op-id", null);
  });
});
