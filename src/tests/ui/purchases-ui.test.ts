import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
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
import {
  PurchaseFlowError,
  PurchaseFlowErrorCode,
  type PurchaseOperationHelper,
} from "../../helpers/purchase-operation-helper";

import { SDKEventName } from "../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../mocks/events-tracker-mock-provider";
import type { CheckoutStartResponse } from "../../networking/responses/checkout-start-response";
import type { CheckoutCalculateTaxResponse } from "../../networking/responses/checkout-calculate-tax-response";
import * as constants from "../../helpers/constants";

const eventsTrackerMock = createEventsTrackerMock();

const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
  checkoutCalculateTax: async () =>
    Promise.resolve(
      checkoutCalculateTaxResponse as CheckoutCalculateTaxResponse,
    ),
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

  test("displays error when an unreachable email is submitted", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockRejectedValue(
      new PurchaseFlowError(
        PurchaseFlowErrorCode.MissingEmailError,
        "Email domain is not valid. Please check the email address or try a different one.",
      ),
    );

    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutCalculateTax",
    ).mockResolvedValue({ data: checkoutCalculateTaxResponse });

    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: undefined },
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, {
      target: { value: "test@unrechable.com" },
    });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    await new Promise(process.nextTick);

    expect(screen.getByText(/Email domain is not valid/)).toBeInTheDocument();
  });

  test("clears domain email errors after they are fixed", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockRejectedValue(
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

  test("performs tax calculation when gateway_tax_collection_enabled is true and VITE_ALLOW_TAX_CALCULATION_FF is enabled", async () => {
    vi.spyOn(constants, "ALLOW_TAX_CALCULATION_FF", "get").mockReturnValue(
      true,
    );

    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutCalculateTax")
      .mockResolvedValue({ data: checkoutCalculateTaxResponse });

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

  test("does not perform tax calculation when VITE_ALLOW_TAX_CALCULATION_FF is disabled, even if gateway_tax_collection_enabled is true", async () => {
    vi.spyOn(constants, "ALLOW_TAX_CALCULATION_FF", "get").mockReturnValue(
      false,
    );

    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutCalculateTax")
      .mockResolvedValue({ data: checkoutCalculateTaxResponse });

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

    expect(calculateTaxSpy).not.toHaveBeenCalled();
  });

  test("does not perform tax calculation when gateway_tax_collection_enabled is false", async () => {
    vi.spyOn(purchaseOperationHelperMock, "checkoutStart").mockResolvedValue(
      checkoutStartResponse,
    );

    const calculateTaxSpy = vi
      .spyOn(purchaseOperationHelperMock, "checkoutCalculateTax")
      .mockResolvedValue({ data: checkoutCalculateTaxResponse });

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

  test("NOTs render CheckoutBillingFormImpression when email has been provided", async () => {
    render(PurchasesUI, {
      props: { ...basicProps, customerEmail: "test@test.com" },
    });

    expect(screen.queryByText(/Billing email address/));
  });

  test("tracks the CheckoutFlowError event when an email is handled at the root component", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutStart",
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
        eventName: SDKEventName.CheckoutFlowError,
      }),
    );
  });

  test("does NOT track the CheckoutBillingFormError event when a different error occurs", async () => {
    vi.spyOn(
      purchaseOperationHelperMock,
      "checkoutStart",
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
        eventName: SDKEventName.CheckoutBillingFormError,
      }),
    );
  });
});
