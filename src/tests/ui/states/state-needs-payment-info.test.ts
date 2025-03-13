import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi, beforeEach } from "vitest";
import StateNeedsPaymentInfo from "../../../ui/states/state-needs-payment-info.svelte";
import {
  brandingInfo,
  rcPackage,
  checkoutStartResponse,
} from "../../../stories/fixtures";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";
import type { PurchaseOperationHelper } from "../../../helpers/purchase-operation-helper";
import type { CheckoutStartResponse } from "../../../networking/responses/checkout-start-response";
import { writable } from "svelte/store";
import { Translator } from "../../../ui/localization/translator";
import { translatorContextKey } from "../../../ui/localization/constants";
import { StripeService } from "../../../stripe/stripe-service";
import type { StripePaymentElementChangeEvent } from "@stripe/stripe-js";

const eventsTrackerMock = createEventsTrackerMock();
const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
  checkoutComplete: async () => Promise.resolve(null),
} as unknown as PurchaseOperationHelper;

const basicProps = {
  brandingInfo: brandingInfo,
  purchaseOption: rcPackage.rcBillingProduct.defaultPurchaseOption,
  productDetails: rcPackage.rcBillingProduct,
  processing: false,
  paymentInfoCollectionMetadata: checkoutStartResponse,
  purchaseOperationHelper: purchaseOperationHelperMock,
  onClose: vi.fn(),
  onContinue: vi.fn(),
};

const defaultContext = new Map(
  Object.entries({
    [eventsTrackerContextKey]: eventsTrackerMock,
    [translatorContextKey]: writable(new Translator()),
  }),
);

vi.mock("../../../stripe/stripe-service", () => ({
  StripeService: {
    initializeStripe: vi.fn().mockResolvedValue({
      stripe: { exists: true },
      elements: {
        _elements: [1],
        submit: vi.fn().mockResolvedValue({ error: null }),
      },
    }),
    createPaymentElement: vi.fn(),
    isStripeHandledCardError: vi.fn().mockReturnValue(false),
  },
}));

describe("PurchasesUI", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("tracks the PaymentEntryImpression event when the payment entry is displayed", async () => {
    render(StateNeedsPaymentInfo, {
      props: {
        ...basicProps,
      },
      context: defaultContext,
    });

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormImpression,
    });
  });

  test("tracks the PaymentEntrySubmit event when the payment entry is submitted", async () => {
    const paymentElementMock = {
      on: (
        event: string,
        callback: (event: StripePaymentElementChangeEvent) => void,
      ) => {
        if (event === "change") {
          callback({
            complete: true,
            value: {
              type: "card",
            },
            elementType: "payment",
            empty: false,
            collapsed: false,
          });
        }
      },
      mount: vi.fn(),
      destroy: vi.fn(),
    };

    vi.mocked(StripeService.createPaymentElement).mockReturnValue(
      // @ts-expect-error - this is a mock
      paymentElementMock,
    );

    render(StateNeedsPaymentInfo, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();

    const paymentForm = screen.getByTestId("payment-form");
    await fireEvent.submit(paymentForm);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormSubmit,
      properties: {
        selectedPaymentMethod: "card",
      },
    });
  });

  test("tracks the PaymentEntryGatewayError event when the payment entry is submitted and failed", async () => {
    render(StateNeedsPaymentInfo, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();

    const paymentForm = screen.getByTestId("payment-form");
    await fireEvent.submit(paymentForm);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormGatewayError,
      properties: {
        errorCode: "0",
        errorMessage: "Failed to initialize payment form",
      },
    });
  });
});
