import "@testing-library/jest-dom";
import { render, fireEvent, screen, waitFor } from "@testing-library/svelte";
import { afterEach, describe, expect, test, vi } from "vitest";
import PurchasesUI from "../../ui/purchases-ui.svelte";
import {
  brandingInfo,
  checkoutPricingResponse,
  checkoutStartResponse,
  rcPackage,
  subscriptionOption,
} from "../../stories/fixtures";
import type { Purchases } from "../../main";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  type PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import type { CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { CheckoutPricingResponse } from "../../networking/responses/checkout-pricing-response";
import {
  checkoutCompleteResponse,
  checkoutPrepareResponse,
} from "../test-responses";
import type { CheckoutCompleteResponse } from "../../networking/responses/checkout-complete-response";
import type { SubscriptionOptionResponse } from "../../networking/responses/products-response";

const eventsTrackerMock = createEventsTrackerMock();

// Before the customer enters an address, every pricing refresh forwards the tax
// location fields as undefined and lets the backend fall back to IP geolocation.
const noTaxLocation = {
  countryCode: undefined,
  postalCode: undefined,
  state: undefined,
  city: undefined,
  addressLine1: undefined,
  addressLine2: undefined,
};

const createCheckoutPricingResponse = (
  discountCode: string | null,
  options?: {
    durationMode?: "time_window" | null;
    timeWindow?: string | null;
    selectedPurchaseOption?: SubscriptionOptionResponse | null;
  },
): CheckoutPricingResponse => {
  const subtotalInMicros =
    checkoutPricingResponse.total_excluding_tax_in_micros;
  const discountedAmountInMicros = 1000000;
  const discountedSubtotalInMicros = discountCode
    ? subtotalInMicros - discountedAmountInMicros
    : subtotalInMicros;

  return {
    ...structuredClone(checkoutPricingResponse),
    original_amount_in_micros: subtotalInMicros,
    total_excluding_tax_in_micros: discountedSubtotalInMicros,
    total_amount_in_micros: discountedSubtotalInMicros,
    tax_amount_in_micros: 0,
    tax_breakdown: [],
    selected_purchase_option: options?.selectedPurchaseOption,
    applied_discounts: discountCode
      ? [
          {
            identifier: "discount-id",
            display_name: "SAVE10",
            discounted_amount_in_micros: discountedAmountInMicros,
            percentage: 10,
            discount_code: discountCode,
            duration_mode: options?.durationMode ?? null,
            time_window: options?.timeWindow ?? null,
          },
        ]
      : [],
  };
};

const createSessionSubscriptionOptionResponse = (
  fields: Partial<SubscriptionOptionResponse> = {},
): SubscriptionOptionResponse => ({
  id: "session_option",
  price_id: "session_price",
  base: {
    cycle_count: 1,
    period_duration: "P1M",
    price: {
      amount_micros: 2990000,
      currency: "USD",
    },
  },
  trial: null,
  intro_price: null,
  discount: null,
  ...fields,
});

const sessionTrialPurchaseOption = createSessionSubscriptionOptionResponse({
  id: "session_trial_option",
  price_id: "session_trial_price",
  trial: {
    cycle_count: 1,
    period_duration: "P1W",
    price: null,
  },
});

const sessionIntroBasePurchaseOption = createSessionSubscriptionOptionResponse({
  id: "base_option",
  price_id: "session_base_price",
  intro_price: {
    cycle_count: 1,
    period_duration: "P2W",
    price: {
      amount_micros: 4990000,
      currency: "USD",
    },
  },
});

const sessionForeverFreePurchaseOption =
  createSessionSubscriptionOptionResponse({
    id: "discnt_foreverfree",
    price_id: "session_foreverfree_price",
    base: {
      cycle_count: 1,
      period_duration: "P1Y",
      price: {
        amount_micros: 100000000,
        currency: "USD",
      },
    },
    trial: null,
    intro_price: null,
    discount: {
      name: "foreverfree",
      currency: "USD",
      amount_micros: 0,
      duration_mode: "forever",
      time_window: null,
      discount_type: "percentage",
      percentage: 100,
      fixed_amount_micros: null,
    },
  });

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  prepareCheckout: async () => Promise.resolve(checkoutPrepareResponse),
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
  checkoutComplete: async () =>
    Promise.resolve(checkoutCompleteResponse as CheckoutCompleteResponse),
  pollCurrentPurchaseForCompletion: async () =>
    Promise.resolve({ redemptionInfo: null, operationSessionId: "op-id" }),
  checkoutRefreshPricing: async () =>
    Promise.resolve(createCheckoutPricingResponse(null)),
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
      .spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValue(
        createCheckoutPricingResponse(null, {
          selectedPurchaseOption: sessionTrialPurchaseOption,
        }),
      );

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
    await waitFor(() => {
      expect(screen.getByText("Try free for 1 week")).toBeInTheDocument();
      expect(
        screen.getByText(/After your trial ends, you will be charged/i),
      ).toBeInTheDocument();
    });
  });

  test("does not perform tax calculation when gateway_tax_collection_enabled is false", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValue(checkoutPricingResponse);

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

  test("bootstraps with an incoming discount code by refreshing checkout pricing", async () => {
    const checkoutStartSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutStart")
      .mockResolvedValue(checkoutStartResponse);
    const checkoutRefreshPricingSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValue(createCheckoutPricingResponse("SAVE10"));

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        discountCode: "SAVE10",
      },
    });

    await waitFor(() => {
      expect(checkoutStartSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: rcPackage.webBillingProduct.identifier,
          purchaseOption: subscriptionOption,
          presentedOfferingContext:
            rcPackage.webBillingProduct.presentedOfferingContext,
          customerEmail: "test@test.com",
        }),
      );
      expect(checkoutRefreshPricingSpy).toHaveBeenCalledWith({
        ...noTaxLocation,
        discountCode: "SAVE10",
      });
      expect(
        screen.getByRole("button", { name: "Remove promo code SAVE10" }),
      ).toBeTruthy();
      expect(screen.queryByLabelText("Promo code")).toBeNull();
      expect(screen.getByText("-$1.00")).toBeTruthy();
    });
  });

  test("does not render stale trial copy when session purchase option removes the trial", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );
    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutRefreshPricing",
    ).mockResolvedValue(
      createCheckoutPricingResponse("FOREVERFREE", {
        selectedPurchaseOption: sessionForeverFreePurchaseOption,
      }),
    );

    render(PurchasesUI, {
      props: {
        ...basicProps,
        brandingInfo: {
          ...brandingInfo,
          gateway_tax_collection_enabled: true,
        },
        showDiscountCodeField: true,
        discountCode: "FOREVERFREE",
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/After trial ends, on/i)).toBeNull();
      expect(screen.queryByText(/After your trial ends/i)).toBeNull();
      expect(screen.queryByRole("button", { name: /start trial/i })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Remove promo code FOREVERFREE" }),
      ).toBeInTheDocument();
    });
  });

  test("falls back to /products purchase option data before session purchase options exist", async () => {
    render(PurchasesUI, {
      props: {
        ...basicProps,
        brandingInfo,
      },
    });

    await waitFor(() => {
      expect(screen.queryByText("Try free for 1 week")).toBeNull();
      expect(
        screen.getByText(/By subscribing, you agree to allow/i),
      ).toBeInTheDocument();
    });
  });

  test("shows the error page if incoming pricing refresh hits a fatal interrupt", async () => {
    const interruptError = new PurchaseFlowError(
      PurchaseFlowErrorCode.StripeMissingRequiredPermission,
      "There was a problem with the store.",
      "missing_required_permission",
    );

    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutRefreshPricing",
    ).mockRejectedValue(interruptError);

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        discountCode: "SAVE10",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Missing Stripe permission")).toBeTruthy();
    });
  });

  test("applies a discount code, refreshes checkout pricing, and notifies the host", async () => {
    const onDiscountCodeChanged = vi.fn();
    const checkoutRefreshPricingSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValue(
        createCheckoutPricingResponse("SAVE10", {
          selectedPurchaseOption: sessionTrialPurchaseOption,
        }),
      );

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
      expect(checkoutRefreshPricingSpy).toHaveBeenCalledWith({
        ...noTaxLocation,
        discountCode: "SAVE10",
      });
      expect(onDiscountCodeChanged).toHaveBeenCalledWith("SAVE10");
      expect(
        screen.getByRole("button", { name: "Remove promo code SAVE10" }),
      ).toBeTruthy();
      expect(screen.getByText("-$1.00")).toBeTruthy();
      expect(screen.queryByText("Total excluding tax")).not.toBeInTheDocument();
      expect(screen.getByText("Try free for 1 week")).toBeInTheDocument();
    });
  });

  test("renders time-window discount labels from refreshed pricing metadata", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutRefreshPricing",
    ).mockResolvedValue(
      createCheckoutPricingResponse("SAVE10", {
        durationMode: "time_window",
        timeWindow: "P3M",
      }),
    );

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
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
      expect(screen.getByText("10% off for 3 months")).toBeTruthy();
    });
  });

  test("removes an applied discount code, refreshes checkout pricing, and restores the input", async () => {
    const onDiscountCodeChanged = vi.fn();
    const checkoutRefreshPricingSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValueOnce(
        createCheckoutPricingResponse("SAVE10", {
          selectedPurchaseOption: sessionTrialPurchaseOption,
        }),
      )
      .mockResolvedValueOnce(
        createCheckoutPricingResponse(null, {
          selectedPurchaseOption: sessionIntroBasePurchaseOption,
        }),
      );

    render(PurchasesUI, {
      props: {
        ...basicProps,
        showDiscountCodeField: true,
        discountCode: "SAVE10",
        onDiscountCodeChanged,
      },
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Remove promo code SAVE10" }),
      ).toBeTruthy();
      expect(screen.getByText("-$1.00")).toBeTruthy();
      expect(screen.getByText("Try free for 1 week")).toBeInTheDocument();
    });

    const removeButton = await screen.findByRole("button", {
      name: "Remove promo code SAVE10",
    });
    await fireEvent.click(removeButton);

    await waitFor(() => {
      expect(checkoutRefreshPricingSpy).toHaveBeenNthCalledWith(2, {
        ...noTaxLocation,
        discountCode: null,
      });
      expect(onDiscountCodeChanged).toHaveBeenCalledWith(null);
      expect(screen.getByLabelText("Promo code")).toBeTruthy();
      expect(screen.queryByText("-$1.00")).toBeNull();
      expect(screen.queryByText("Try free for 1 week")).toBeNull();
      expect(screen.getByText(/First 2 weeks for/i)).toBeInTheDocument();
    });
  });

  test("keeps the current active purchase option unchanged when applying an invalid discount code fails", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutRefreshPricing")
      .mockResolvedValueOnce(
        createCheckoutPricingResponse(null, {
          selectedPurchaseOption: sessionTrialPurchaseOption,
        }),
      )
      .mockRejectedValueOnce(new Error("Invalid promo code."));

    render(PurchasesUI, {
      props: {
        ...basicProps,
        brandingInfo: {
          ...brandingInfo,
          gateway_tax_collection_enabled: true,
        },
        showDiscountCodeField: true,
      },
    });

    const discountCodeInput = screen.getByLabelText("Promo code");
    await waitFor(() => {
      expect(discountCodeInput).not.toBeDisabled();
      expect(screen.getByText("Try free for 1 week")).toBeInTheDocument();
    });

    await fireEvent.input(discountCodeInput, {
      target: { value: "BADCODE" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(screen.getByText("Code can't be applied.")).toBeInTheDocument();
      expect(screen.getByText("Try free for 1 week")).toBeInTheDocument();
      expect(screen.getByDisplayValue("BADCODE")).toBeInTheDocument();
    });
  });
});
