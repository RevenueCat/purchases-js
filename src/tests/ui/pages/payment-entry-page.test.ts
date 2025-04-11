import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi, beforeEach } from "vitest";
import PaymentEntryPage from "../../../ui/pages/payment-entry-page.svelte";
import {
  brandingInfo,
  rcPackage,
  checkoutStartResponse,
  priceBreakdownTaxDisabled,
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
import type {
  StripeError,
  StripePaymentElementChangeEvent,
} from "@stripe/stripe-js";
import type { ComponentProps } from "svelte";

const eventsTrackerMock = createEventsTrackerMock();
const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
  checkoutComplete: async () => Promise.resolve(null),
} as unknown as PurchaseOperationHelper;

const basicProps: ComponentProps<PaymentEntryPage> = {
  brandingInfo: brandingInfo,
  priceBreakdown: priceBreakdownTaxDisabled,
  purchaseOption: rcPackage.webBillingProduct.defaultPurchaseOption,
  productDetails: rcPackage.webBillingProduct,
  processing: false,
  purchaseOperationHelper: purchaseOperationHelperMock,
  checkoutStartResponse: checkoutStartResponse,
  initialTaxCalculation: null,
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
    initializeStripe: vi.fn(),
    createPaymentElement: vi.fn(),
    isStripeHandledCardError: vi.fn(),
  },
}));

describe("PurchasesUI", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.mocked(StripeService.initializeStripe).mockResolvedValue({
      // @ts-expect-error - This is a mock
      stripe: { exists: true },
      elements: {
        // @ts-expect-error - This is a mock
        _elements: [1],
        submit: vi.fn().mockResolvedValue({ error: null }),
      },
    });
    vi.mocked(StripeService.isStripeHandledCardError).mockReturnValue(false);
  });

  test("tracks the PaymentEntryImpression event when the payment entry is displayed", async () => {
    render(PaymentEntryPage, {
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
    const paymentElement = {
      on: (
        eventType: string,
        callback: (event?: StripePaymentElementChangeEvent) => void,
      ) => {
        if (eventType === "ready") {
          setTimeout(() => callback(), 0);
        }
        if (eventType === "change") {
          setTimeout(() => {
            callback({
              complete: true,
              value: {
                type: "card",
              },
              elementType: "payment",
              empty: false,
              collapsed: false,
            });
          }, 100);
        }
      },
      mount: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(StripeService.createPaymentElement).mockReturnValue(
      // @ts-expect-error - This is a mock
      paymentElement,
    );

    render(PaymentEntryPage, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();
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

  test("tracks the CheckoutPaymentFormGatewayError event when the payment form fails to initialize", async () => {
    vi.mocked(StripeService.initializeStripe).mockRejectedValue(
      new Error("Failed to initialize payment form"),
    );

    render(PaymentEntryPage, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormGatewayError,
      properties: {
        errorCode: "",
        errorMessage: "Failed to initialize payment form",
      },
    });
  });

  test("tracks the CheckoutPaymentFormGatewayError event when stripe onload error occurs", async () => {
    const paymentElement = {
      on: (
        eventType: string,
        callback: (event?: {
          elementType: "payment";
          error: StripeError;
        }) => void,
      ) => {
        if (eventType === "loaderror") {
          setTimeout(
            () =>
              callback({
                elementType: "payment",
                error: {
                  code: "0",
                  message: "Failed to initialize payment form",
                } as StripeError,
              }),
            0,
          );
        }
      },
      mount: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(StripeService.createPaymentElement).mockReturnValue(
      // @ts-expect-error - This is a mock
      paymentElement,
    );
    render(PaymentEntryPage, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormGatewayError,
      properties: {
        errorCode: "0",
        errorMessage: "Failed to initialize payment form",
      },
    });
  });

  test("tracks the CheckoutPaymentFormGatewayError event when stripe submit returns error", async () => {
    const stripeInitializationMock = {
      stripe: { exists: true },
      elements: {
        _elements: [1],
        submit: vi.fn().mockResolvedValue({
          error: {
            type: "api_error",
            code: "0",
            message: "Submission error",
          },
        }),
      },
    };
    vi.mocked(StripeService.initializeStripe).mockReturnValue(
      // @ts-expect-error - This is a mock
      stripeInitializationMock,
    );

    const paymentElement = {
      on: (
        eventType: string,
        callback: (event?: StripePaymentElementChangeEvent) => void,
      ) => {
        if (eventType === "ready") {
          setTimeout(() => callback(), 0);
        }
        if (eventType === "change") {
          setTimeout(() => {
            callback({
              complete: true,
              value: {
                type: "card",
              },
              elementType: "payment",
              empty: false,
              collapsed: false,
            });
          }, 100);
        }
      },
      mount: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(StripeService.createPaymentElement).mockReturnValue(
      // @ts-expect-error - This is a mock
      paymentElement,
    );

    render(PaymentEntryPage, {
      props: { ...basicProps },
      context: defaultContext,
    });

    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();

    const paymentForm = screen.getByTestId("payment-form");
    await fireEvent.submit(paymentForm);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPaymentFormGatewayError,
      properties: {
        errorCode: "0",
        errorMessage: "Submission error",
      },
    });
  });
});
