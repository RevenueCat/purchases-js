import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, afterEach, vi, beforeEach } from "vitest";
import PurchasesUI from "../../ui/rcb-ui.svelte";
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
import { SDKEventName } from "../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";

const eventsTrackerMock = createEventsTrackerMock();

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
    vi.clearAllMocks();
    vi.useRealTimers();
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

  test("clears domain email errors after they are fixed", async () => {
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
      target: { value: "testest.com" },
    });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);
    expect(screen.getByText(/Email is not valid/)).toBeInTheDocument();

    await fireEvent.input(emailInput, {
      target: { value: "test@test.com" },
    });
    await fireEvent.click(continueButton);

    expect(screen.queryByText(/Email is not valid/)).not.toBeInTheDocument();
  });

  test("NOTs render BillingEmailEntryImpression when email has been provided", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: "test@test.com" },
    });

    expect(screen.queryByText(/Billing email address/));
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

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.BillingEmailEntryError,
      properties: {
        errorCode: 4,
        errorMessage:
          "Email domain is not valid. Please check the email address or try a different one.",
      },
    });
  });

  test("tracks the BillingEmailEntryError event when an unreachable email is submitted", async () => {
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

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: SDKEventName.BillingEmailEntryError,
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

    expect(eventsTrackerMock.trackSDKEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: SDKEventName.BillingEmailEntryError,
      }),
    );
  });
});
