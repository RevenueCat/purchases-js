import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import PaddlePurchasesUI from "../../ui/paddle-purchases-ui.svelte";
import {
  brandingInfo,
  rcPackage,
  subscriptionOption,
} from "../../stories/fixtures";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../ui/constants";
import { translatorContextKey } from "../../ui/localization/constants";
import { Translator } from "../../ui/localization/translator";
import { writable } from "svelte/store";
import type { PaddleService } from "../../paddle/paddle-service";
import type { PaddleCheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { OperationSessionSuccessfulResult } from "../../helpers/purchase-operation-helper";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
} from "../../helpers/purchase-operation-helper";
import type { ComponentProps } from "svelte";

const eventsTrackerMock = createEventsTrackerMock();

const defaultContext = new Map(
  Object.entries({
    [eventsTrackerContextKey]: eventsTrackerMock,
    [translatorContextKey]: writable(new Translator()),
  }),
);

const paddleCheckoutStartResponse: PaddleCheckoutStartResponse = {
  operation_session_id: "test-operation-session-id",
  gateway_params: null,
  management_url: null,
  paddle_billing_params: {
    client_side_token: "test-client-side-token",
    is_sandbox: true,
    transaction_id: "test-transaction-id",
  },
};

const operationSessionSuccessfulResult: OperationSessionSuccessfulResult = {
  redemptionInfo: null,
  operationSessionId: "test-operation-session-id",
  storeTransactionIdentifier: "test-store-transaction-id",
  productIdentifier: "test-product-id",
  purchaseDate: new Date("2024-01-01"),
};

const createPaddleServiceMock = (): PaddleService => {
  return {
    startCheckout: vi.fn().mockResolvedValue(paddleCheckoutStartResponse),
    purchase: vi.fn().mockResolvedValue(operationSessionSuccessfulResult),
  } as unknown as PaddleService;
};

const baseProps: ComponentProps<PaddlePurchasesUI> = {
  brandingInfo: brandingInfo,
  eventsTracker: eventsTrackerMock,
  selectedLocale: "en",
  defaultLocale: "en",
  customTranslations: {},
  isInElement: false,
  skipSuccessPage: false,
  onFinished: vi.fn(),
  onError: vi.fn(),
  productDetails: rcPackage.webBillingProduct,
  rcPackage: rcPackage,
  appUserId: "test-app-user-id",
  purchaseOption: subscriptionOption,
  customerEmail: undefined,
  metadata: undefined,
  unmountPaddlePurchaseUi: vi.fn(),
  paddleService: createPaddleServiceMock(),
};

const continueButtonRegex = /return to some fantastic cat, inc\./i;

describe("PaddlePurchasesUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document styles
    document.documentElement.style.height = "";
    document.documentElement.style.overflow = "";
    document.body.style.height = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("calls startCheckout and purchase on mount", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const startCheckoutSpy = vi.spyOn(paddleServiceMock, "startCheckout");
    const purchaseSpy = vi.spyOn(paddleServiceMock, "purchase");

    render(PaddlePurchasesUI, {
      props: { ...baseProps, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await expect(startCheckoutSpy).toHaveBeenCalledWith({
      appUserId: "test-app-user-id",
      productId: rcPackage.webBillingProduct.identifier,
      presentedOfferingContext: {
        offeringIdentifier:
          rcPackage.webBillingProduct.presentedOfferingContext
            .offeringIdentifier,
        targetingContext: null,
        placementIdentifier: null,
      },
      purchaseOption: subscriptionOption,
      customerEmail: undefined,
      metadata: undefined,
    });

    await expect(purchaseSpy).toHaveBeenCalledWith({
      operationSessionId: "test-operation-session-id",
      transactionId: "test-transaction-id",
      onCheckoutLoaded: expect.any(Function),
      unmountPaddlePurchaseUi: expect.any(Function),
      params: {
        rcPackage: rcPackage,
        purchaseOption: subscriptionOption,
        appUserId: "test-app-user-id",
        presentedOfferingIdentifier:
          rcPackage.webBillingProduct.presentedOfferingContext
            .offeringIdentifier,
        customerEmail: undefined,
        locale: "en",
      },
    });
  });

  test("transitions to loading page when checkout is loaded", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    let onCheckoutLoadedCallback: (() => void) | undefined;

    vi.spyOn(paddleServiceMock, "purchase").mockImplementation(
      async (params) => {
        onCheckoutLoadedCallback = params.onCheckoutLoaded;
        if (onCheckoutLoadedCallback) {
          onCheckoutLoadedCallback();
        }
        // Keep promise pending so loading state persists
        return new Promise(() => {});
      },
    );

    render(PaddlePurchasesUI, {
      props: { ...baseProps, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    const loadingText = await screen.findByText("Processing payment");
    expect(loadingText).toBeInTheDocument();
  });

  test("transitions to success page on successful purchase", async () => {
    const paddleServiceMock = createPaddleServiceMock();

    render(PaddlePurchasesUI, {
      props: { ...baseProps, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    const continueButton = await screen.findByRole("button", {
      name: continueButtonRegex,
    });
    expect(continueButton).toBeInTheDocument();
    expect(screen.getByText("Payment complete")).toBeInTheDocument();
  });

  test("calls onFinished with result when skipSuccessPage is true", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const onFinished = vi.fn();

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        skipSuccessPage: true,
        onFinished,
        paddleService: paddleServiceMock,
      },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(onFinished).toHaveBeenCalledWith(operationSessionSuccessfulResult);
    });
  });

  test("calls onFinished when continue button is clicked on success page", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const onFinished = vi.fn();

    render(PaddlePurchasesUI, {
      props: { ...baseProps, onFinished, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    const continueButton = await screen.findByRole("button", {
      name: continueButtonRegex,
    });
    expect(continueButton).toBeInTheDocument();

    continueButton.click();

    await waitFor(() => {
      expect(onFinished).toHaveBeenCalledWith(operationSessionSuccessfulResult);
    });
  });

  test("handles startCheckout error and displays error page", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const onError = vi.fn();
    const startCheckoutError = new PurchaseFlowError(
      PurchaseFlowErrorCode.ErrorSettingUpPurchase,
      "Failed to start checkout",
    );

    vi.spyOn(paddleServiceMock, "startCheckout").mockRejectedValue(
      startCheckoutError,
    );

    render(PaddlePurchasesUI, {
      props: { ...baseProps, onError, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(startCheckoutError);
    });

    const errorPage = await screen.findByText("Something went wrong");
    expect(errorPage).toBeInTheDocument();
    expect(
      screen.getByText(/Purchase not started due to an error /i),
    ).toBeInTheDocument();
  });

  test("handles purchase error and displays error page", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const onError = vi.fn();
    const purchaseError = new PurchaseFlowError(
      PurchaseFlowErrorCode.ErrorChargingPayment,
      "Payment failed",
    );

    vi.spyOn(paddleServiceMock, "purchase").mockRejectedValue(purchaseError);

    render(PaddlePurchasesUI, {
      props: { ...baseProps, onError, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(purchaseError);
    });

    const errorPage = await screen.findByText("Something went wrong");
    expect(errorPage).toBeInTheDocument();
    expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
  });

  test("handles non-PurchaseFlowError in purchase and converts to PurchaseFlowError", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const onError = vi.fn();
    const genericError = new Error("Generic error");

    vi.spyOn(paddleServiceMock, "purchase").mockRejectedValue(genericError);

    render(PaddlePurchasesUI, {
      props: { ...baseProps, onError, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await waitFor(() => expect(onError).toHaveBeenCalled());
    const errorArg = onError.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(PurchaseFlowError);
    expect(errorArg.errorCode).toBe(PurchaseFlowErrorCode.UnknownError);

    const errorPage = await screen.findByText("Something went wrong");
    expect(errorPage).toBeInTheDocument();
    expect(screen.getByText(/An unknown error occurred/i)).toBeInTheDocument();
  });

  test("sets document styles when not in element", async () => {
    const paddleServiceMock = createPaddleServiceMock();

    render(PaddlePurchasesUI, {
      props: { ...baseProps, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(document.documentElement.style.height).toBe("100%");
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.body.style.height).toBe("100%");
    });
  });

  test("does not set document styles when in element", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const originalHeight = document.documentElement.style.height;
    const originalOverflow = document.documentElement.style.overflow;
    const originalBodyHeight = document.body.style.height;

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        isInElement: true,
        paddleService: paddleServiceMock,
      },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(document.documentElement.style.height).toBe(originalHeight);
      expect(document.documentElement.style.overflow).toBe(originalOverflow);
      expect(document.body.style.height).toBe(originalBodyHeight);
    });
  });

  test("restores document styles on unmount when not in element", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "visible";
    document.body.style.height = "auto";

    const { unmount } = render(PaddlePurchasesUI, {
      props: { ...baseProps, paddleService: paddleServiceMock },
      context: defaultContext,
    });

    await expect(document.documentElement.style.height).toBe("100%");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.height).toBe("100%");

    unmount();

    await expect(document.documentElement.style.height).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("visible");
    expect(document.body.style.height).toBe("auto");
  });

  test("calls unmountPaddlePurchaseUi when the button is clicked on the error page", async () => {
    const unmountPaddlePurchaseUi = vi.fn();
    const paddleServiceMock = createPaddleServiceMock();
    const onError = vi.fn();
    const purchaseError = new PurchaseFlowError(
      PurchaseFlowErrorCode.ErrorChargingPayment,
      "Payment failed",
    );

    vi.spyOn(paddleServiceMock, "purchase").mockRejectedValue(purchaseError);

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        onError,
        unmountPaddlePurchaseUi,
        paddleService: paddleServiceMock,
      },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(purchaseError);
    });

    const errorPage = await screen.findByText("Something went wrong");
    expect(errorPage).toBeInTheDocument();
    expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
    screen.logTestingPlaygroundURL();

    const backButton = screen.getByRole("button", { name: /try again/i });
    backButton.click();
    await expect(unmountPaddlePurchaseUi).toHaveBeenCalled();
  });

  test("passes customerEmail and metadata to startCheckout", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const startCheckoutSpy = vi.spyOn(paddleServiceMock, "startCheckout");
    const customerEmail = "test@example.com";
    const metadata = { utm_source: "test" };

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        paddleService: paddleServiceMock,
        customerEmail,
        metadata,
      },
      context: defaultContext,
    });

    await waitFor(() => {
      expect(startCheckoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail,
          metadata,
        }),
      );
    });
  });

  test("Sandbox banner not shown when the startCheckout response returns is_sandbox as false", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const nonSandboxResponse: PaddleCheckoutStartResponse = {
      ...paddleCheckoutStartResponse,
      paddle_billing_params: {
        ...paddleCheckoutStartResponse.paddle_billing_params,
        is_sandbox: false,
      },
    };

    vi.spyOn(paddleServiceMock, "startCheckout").mockResolvedValue(
      nonSandboxResponse,
    );

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        paddleService: paddleServiceMock,
      },
      context: defaultContext,
    });

    await expect(paddleServiceMock.startCheckout).toHaveBeenCalled();

    // Wait for success page to render
    const continueButton = await screen.findByRole("button", {
      name: continueButtonRegex,
    });
    expect(continueButton).toBeInTheDocument();

    const sandboxBanner = document.querySelector(".rcb-ui-sandbox-banner");
    expect(sandboxBanner).not.toBeInTheDocument();
  });

  test("Sandbox banner shown when the startCheckout response returns is_sandbox as true", async () => {
    const paddleServiceMock = createPaddleServiceMock();
    const sandboxResponse: PaddleCheckoutStartResponse = {
      ...paddleCheckoutStartResponse,
      paddle_billing_params: {
        ...paddleCheckoutStartResponse.paddle_billing_params,
        is_sandbox: true,
      },
    };

    vi.spyOn(paddleServiceMock, "startCheckout").mockResolvedValue(
      sandboxResponse,
    );

    render(PaddlePurchasesUI, {
      props: {
        ...baseProps,
        paddleService: paddleServiceMock,
      },
      context: defaultContext,
    });

    await expect(paddleServiceMock.startCheckout).toHaveBeenCalled();

    const sandboxBanner = await screen.findByText("SANDBOX");
    expect(sandboxBanner).toBeInTheDocument();
  });
});
