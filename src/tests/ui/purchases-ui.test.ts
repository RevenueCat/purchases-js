import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, afterEach, vi } from "vitest";
import PurchasesUI from "../../ui/rcb-ui.svelte";
import type { IEventsTracker } from "../../behavioural-events/events-tracker";
import {
  brandingInfo,
  rcPackage,
  product,
  purchaseResponse,
} from "../../stories/fixtures";
import type { Purchases } from "../../main";
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  type PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";
import type { PurchaseResponse } from "../../networking/responses/purchase-response";

const eventsTrackerMock: IEventsTracker = {
  trackCheckoutSessionStart: vi.fn(),
  trackSDKInitialized: vi.fn(),
  trackBillingEmailEntryImpression: vi.fn(),
  trackBillingEmailEntrySubmit: vi.fn(),
  trackBillingEmailEntryDismiss: vi.fn(),
  trackBillingEmailEntryError: vi.fn(),
} as unknown as IEventsTracker;

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  startPurchase: async () =>
    Promise.resolve(purchaseResponse as PurchaseResponse),
} as unknown as PurchaseOperationHelper;

const purchasesMock: Purchases = {
  isSandbox: () => true,
  close: vi.fn(),
} as unknown as Purchases;

const basicProps = {
  purchases: purchasesMock,
  eventsTracker: eventsTrackerMock,
  purchaseOperationHelper: purchaseOperationHelperMock,
  rcPackage: rcPackage,
  purchaseOption: null,
  brandingInfo: null,
  isSandbox: true,
  branding: brandingInfo,
  customerEmail: "test@test.com",
  onClose: vi.fn(),
};

describe("PurchasesUI", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("tracks the CheckoutSessionStarted event", async () => {
    render(PurchasesUI, { props: basicProps });

    expect(eventsTrackerMock.trackCheckoutSessionStart).toHaveBeenCalledWith({
      customizationOptions: null,
      productInterval: product.normalPeriodDuration,
      productPrice: product.currentPrice.amountMicros,
      productCurrency: product.currentPrice.currency,
      selectedProduct: product.identifier,
      selectedPackage: rcPackage.identifier,
      selectedPurchaseOption: product.defaultPurchaseOption.id,
    });
  });

  test("tracks the BillingEmailEntryImpression event when email has not been provided", async () => {
    render(PurchasesUI, { props: { ...basicProps, customerEmail: null } });

    expect(
      eventsTrackerMock.trackBillingEmailEntryImpression,
    ).toHaveBeenCalledWith();
  });

  test("NOTs track the BillingEmailEntryImpression event when email has been provided", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: "test@test.com" },
    });

    expect(
      eventsTrackerMock.trackBillingEmailEntryImpression,
    ).not.toHaveBeenCalled();
  });

  test("tracks the BillingEmailEntrySubmit event email is submitted", async () => {
    render(PurchasesUI, { props: { ...basicProps, customerEmail: undefined } });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "test@test.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(
      eventsTrackerMock.trackBillingEmailEntrySubmit,
    ).toHaveBeenCalledWith();
  });

  test("tracks the BillingEmailEntryDismiss event when the billing email entry is closed", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const closeButton = screen.getByTestId("close-button");
    await fireEvent.click(closeButton);

    expect(
      eventsTrackerMock.trackBillingEmailEntryDismiss,
    ).toHaveBeenCalledWith();
    expect(basicProps.onClose).toHaveBeenCalled();
  });

  test("tracks the BillingEmailEntryError event when the billing email entry has an email format error", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "testest.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackBillingEmailEntryError).toHaveBeenCalledWith({
      errorCode: null,
      errorMessage: "Email is not valid. Please provide a valid email address.",
    });
  });

  test("tracks the BillingEmailEntryError event when the billing email entry has an email format error", async () => {
    vi.spyOn(purchaseOperationHelperMock, "startPurchase").mockRejectedValue(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.MissingEmailError,
        "Email domain is not valid. Please check the email address or try a different one.",
      ),
    );

    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, {
      target: { value: "test@unrechable.com" },
    });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackBillingEmailEntryError).toHaveBeenCalledWith({
      errorCode: 4,
      errorMessage:
        "Email domain is not valid. Please check the email address or try a different one.",
    });
  });

  test("displays error when an invalid email format is submitted", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "testest.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(screen.getByText(/Email is not valid/)).toBeInTheDocument();
  });

  test("displays error when an unreachable email is submitted", async () => {
    vi.spyOn(purchaseOperationHelperMock, "startPurchase").mockRejectedValue(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.MissingEmailError,
        "Email domain is not valid. Please check the email address or try a different one.",
      ),
    );

    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, {
      target: { value: "test@invalid.com" },
    });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(screen.getByText(/Email domain is not valid/)).toBeInTheDocument();
  });
});
