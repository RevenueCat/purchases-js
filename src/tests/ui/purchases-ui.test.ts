import "@testing-library/jest-dom";
import { render, fireEvent, screen, waitFor } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import PurchasesUI from "../../ui/purchases-ui.svelte";
import {
  brandingInfo,
  checkoutCalculateTaxResponse,
  checkoutStartResponse,
  product,
  rcPackage,
  subscriptionOption,
  subscriptionOptionWithDiscount,
} from "../../stories/fixtures";
import type { Purchases } from "../../main";
import { type PurchaseOperationHelper } from "../../helpers/purchase-operation-helper";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import type { CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { CheckoutCalculateTaxResponse } from "../../networking/responses/checkout-calculate-tax-response";
import {
  checkoutCompleteResponse,
  checkoutPrepareResponse,
} from "../test-responses";
import type { CheckoutCompleteResponse } from "../../networking/responses/checkout-complete-response";

const eventsTrackerMock = createEventsTrackerMock();
const getProductWithDiscountCodeMock = vi.fn();

const discountedProduct = {
  ...structuredClone(product),
  defaultPurchaseOption: subscriptionOptionWithDiscount,
  defaultSubscriptionOption: subscriptionOptionWithDiscount,
  subscriptionOptions: {
    [subscriptionOptionWithDiscount.id]: subscriptionOptionWithDiscount,
  },
  price: subscriptionOptionWithDiscount.base.price,
  freeTrialPhase: subscriptionOptionWithDiscount.trial,
  discountPhase: subscriptionOptionWithDiscount.discount,
  introPricePhase: subscriptionOptionWithDiscount.introPrice,
};

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  prepareCheckout: async () => Promise.resolve(checkoutPrepareResponse),
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
  _getProductWithDiscountCode: getProductWithDiscountCodeMock,
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
  showDiscountCodeField: false,
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
    const purchaseDate = new Date();
    const pollSpy = vi
      .spyOn(purchaseOperationHelperMock, "pollCurrentPurchaseForCompletion")
      .mockResolvedValue({
        redemptionInfo: null,
        operationSessionId: "op-id",
        storeTransactionIdentifier: "store-tx-id",
        productIdentifier: "product-id",
        purchaseDate: purchaseDate,
      });

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
    expect(onFinished).toHaveBeenCalledWith({
      operationSessionId: "op-id",
      productIdentifier: "product-id",
      storeTransactionIdentifier: "store-tx-id",
      purchaseDate: purchaseDate,
      redemptionInfo: null,
    });
  });

  test("passes workflowPurchaseContext to checkoutStart when provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);

    render(PurchasesUI, {
      props: {
        ...basicProps,
        workflowPurchaseContext: { stepId: "test-step-123" },
      },
    });

    await new Promise(process.nextTick);

    expect(checkoutStartSpy).toHaveBeenCalledWith({
      appUserId: "app-user-id",
      productId: rcPackage.webBillingProduct.identifier,
      purchaseOption: subscriptionOption,
      presentedOfferingContext:
        rcPackage.webBillingProduct.presentedOfferingContext,
      customerEmail: "test@test.com",
      metadata: { utm_term: "something" },
      workflowPurchaseContext: { stepId: "test-step-123" },
    });
  });

  test("passes undefined workflowPurchaseContext to checkoutStart when not provided", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);

    render(PurchasesUI, {
      props: {
        ...basicProps,
      },
    });

    await new Promise(process.nextTick);

    expect(checkoutStartSpy).toHaveBeenCalledWith({
      appUserId: "app-user-id",
      productId: rcPackage.webBillingProduct.identifier,
      purchaseOption: subscriptionOption,
      presentedOfferingContext:
        rcPackage.webBillingProduct.presentedOfferingContext,
      customerEmail: "test@test.com",
      metadata: { utm_term: "something" },
    });
  });

  test("bootstraps with an incoming discount code when discounted product data resolves", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);
    getProductWithDiscountCodeMock.mockResolvedValue({
      productDetails: discountedProduct,
      purchaseOption: subscriptionOptionWithDiscount,
    });

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        discountCode: "SAVE10",
      },
    });

    await waitFor(() => {
      expect(getProductWithDiscountCodeMock).toHaveBeenCalledWith(
        rcPackage,
        subscriptionOption,
        rcPackage.webBillingProduct.price.currency,
        "SAVE10",
      );
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: discountedProduct.identifier,
          purchaseOption: subscriptionOptionWithDiscount,
          presentedOfferingContext: discountedProduct.presentedOfferingContext,
          customerEmail: "test@test.com",
        }),
      );
      expect(screen.getByText("SAVE10")).toBeTruthy();
    });
  });

  test("applies a discount code, restarts checkout, and notifies the host", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);
    const onDiscountCodeChanged = vi.fn();
    getProductWithDiscountCodeMock.mockResolvedValue({
      productDetails: discountedProduct,
      purchaseOption: subscriptionOptionWithDiscount,
    });

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        onDiscountCodeChanged,
      },
    });

    const discountCodeInput = screen.getByLabelText("Promo code");
    await waitFor(() => {
      expect(discountCodeInput).not.toBeDisabled();
    });

    await fireEvent.input(discountCodeInput, {
      target: { value: "SAVE10" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(getProductWithDiscountCodeMock).toHaveBeenCalledWith(
        rcPackage,
        subscriptionOption,
        rcPackage.webBillingProduct.price.currency,
        "SAVE10",
      );
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          productId: discountedProduct.identifier,
          purchaseOption: subscriptionOptionWithDiscount,
          presentedOfferingContext: discountedProduct.presentedOfferingContext,
        }),
      );
      expect(onDiscountCodeChanged).toHaveBeenCalledWith("SAVE10");
      expect(screen.getByText("SAVE10")).toBeTruthy();
    });
  });

  test("removes an applied discount code, restarts checkout, and restores the input", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);
    const onDiscountCodeChanged = vi.fn();
    getProductWithDiscountCodeMock
      .mockResolvedValueOnce({
        productDetails: discountedProduct,
        purchaseOption: subscriptionOptionWithDiscount,
      })
      .mockResolvedValueOnce({
        productDetails: rcPackage.webBillingProduct,
        purchaseOption: subscriptionOption,
      });

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        discountCode: "SAVE10",
        onDiscountCodeChanged,
      },
    });

    const removeButton = await screen.findByRole("button", {
      name: "Remove promo code SAVE10",
    });
    await fireEvent.click(removeButton);

    await waitFor(() => {
      expect(getProductWithDiscountCodeMock).toHaveBeenNthCalledWith(
        2,
        rcPackage,
        subscriptionOptionWithDiscount,
        rcPackage.webBillingProduct.price.currency,
        undefined,
      );
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          productId: rcPackage.webBillingProduct.identifier,
          purchaseOption: subscriptionOption,
          presentedOfferingContext:
            rcPackage.webBillingProduct.presentedOfferingContext,
        }),
      );
      expect(onDiscountCodeChanged).toHaveBeenCalledWith(null);
      expect(screen.getByLabelText("Promo code")).toBeTruthy();
    });
  });

  test("shows an error and does not notify the host when a code does not produce discounted pricing", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);
    const onDiscountCodeChanged = vi.fn();
    getProductWithDiscountCodeMock.mockResolvedValue({
      productDetails: rcPackage.webBillingProduct,
      purchaseOption: subscriptionOption,
    });

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        onDiscountCodeChanged,
      },
    });

    const discountCodeInput = screen.getByLabelText("Promo code");
    await waitFor(() => {
      expect(discountCodeInput).not.toBeDisabled();
    });

    await fireEvent.input(discountCodeInput, {
      target: { value: "BADCODE" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(screen.getByText("Code can’t be applied.")).toBeTruthy();
    });

    expect(checkoutStartSpy).toHaveBeenCalledTimes(1);
    expect(onDiscountCodeChanged).not.toHaveBeenCalled();
  });
});
