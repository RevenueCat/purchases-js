import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, afterEach, vi, beforeEach } from "vitest";
import PurchasesUI from "../../ui/rcb-ui.svelte";
import type { IEventsTracker } from "../../behavioural-events/events-tracker";
import {
  brandingInfo,
  rcPackage,
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
  updateUser: vi.fn(),
  generateCheckoutSessionId: vi.fn(),
  trackEvent: vi.fn(),
  dispose: vi.fn(),
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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  test("tracks the BillingEmailEntryImpression event when email has not been provided", async () => {
    render(PurchasesUI, { props: { ...basicProps, customerEmail: null } });

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "billing_email_entry_impression",
    });
  });

  test("NOTs track the BillingEmailEntryImpression event when email has been provided", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: "test@test.com" },
    });

    expect(eventsTrackerMock.trackEvent).not.toHaveBeenCalledWith({
      eventName: "billing_email_entry_impression",
    });
  });

  test("tracks the BillingEmailEntrySubmit event email is submitted", async () => {
    render(PurchasesUI, { props: { ...basicProps, customerEmail: undefined } });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "test@test.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "billing_email_entry_submit",
    });
  });

  test("tracks the BillingEmailEntryDismiss event when the billing email entry is closed", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const closeButton = screen.getByTestId("close-button");
    await fireEvent.click(closeButton);

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "billing_email_entry_dismiss",
    });
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

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "billing_email_entry_error",
      properties: {
        errorCode: null,
        errorMessage:
          "Email is not valid. Please provide a valid email address.",
      },
    });
  });

  test("tracks the BillingEmailEntryError event when the billing email entry has a missing email error", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "startPurchase",
    ).mockRejectedValueOnce(
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

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "billing_email_entry_error",
      properties: {
        errorCode: 4,
        errorMessage:
          "Email domain is not valid. Please check the email address or try a different one.",
      },
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
      target: { value: "test@unrechable.com" },
    });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(screen.getByText(/Email domain is not valid/)).toBeInTheDocument();
  });

  test("tracks the BillingEmailEntryError event when an unreachable email is submitted", async () => {
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

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "billing_email_entry_error",
      }),
    );
  });

  test("does NOT track the BillingEmailEntryError event when a different error occurs", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "startPurchase",
    ).mockRejectedValueOnce(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.UnknownError,
        "Unknown error without state set.",
      ),
    );

    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "test@test.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "billing_email_entry_error",
      }),
    );
  });

  test("tracks the PurchaseSuccessfulImpression event when the purchase is successful", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "startPurchase",
    ).mockResolvedValueOnce({
      operation_session_id: "123",
      next_action: "completed",
      data: {
        client_secret: "123",
        stripe_account_id: "123",
        publishable_api_key: "123",
      },
    });

    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: "test@test.com" },
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "purchase_successful_impression",
    });
  });

  test("tracks the PurchaseSuccessfulDismiss event when the purchase successful dialog is closed", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "startPurchase",
    ).mockResolvedValueOnce({
      operation_session_id: "123",
      next_action: "completed",
      data: {
        client_secret: "123",
        stripe_account_id: "123",
        publishable_api_key: "123",
      },
    });

    render(PurchasesUI, { props: { ...basicProps, onFinished: vi.fn() } });
    await vi.advanceTimersToNextTimerAsync();
    const continueButton = screen.getByTestId("close-button");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "purchase_successful_dismiss",
      properties: {
        buttonPressed: "close",
      },
    });
  });

  test("tracks the PurchaseSuccessfulDismiss event when the purchase successful dialog button is pressed", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "startPurchase",
    ).mockResolvedValueOnce({
      operation_session_id: "123",
      next_action: "completed",
      data: {
        client_secret: "123",
        stripe_account_id: "123",
        publishable_api_key: "123",
      },
    });

    render(PurchasesUI, { props: { ...basicProps, onFinished: vi.fn() } });
    await vi.advanceTimersToNextTimerAsync();
    const continueButton = screen.getByText("Close");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackEvent).toHaveBeenCalledWith({
      eventName: "purchase_successful_dismiss",
      properties: {
        buttonPressed: "go_back_to_app",
      },
    });
  });
});
