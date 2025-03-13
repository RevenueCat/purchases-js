import {} from "svelte";
import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
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

const eventsTrackerMock = createEventsTrackerMock();
const purchaseOperationHelperMock: PurchaseOperationHelper = {
  checkoutStart: async () =>
    Promise.resolve(checkoutStartResponse as CheckoutStartResponse),
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

  // test("tracks the PaymentEntryDismiss event when closed", async () => {
  //   render(StateNeedsPaymentInfo, {
  //     props: { ...basicProps },
  //     context: defaultContext,
  //   });

  //   const closeButton = screen.getByRole("button", { name: "Close" });
  //   await fireEvent.click(closeButton);

  // expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
  //   eventName: SDKEventName.CheckoutBillingFormDismiss,
  // });
  // });

  // test.only("tracks the PaymentEntrySubmit event when the payment entry is submitted", async () => {
  //   render(StateNeedsPaymentInfo, {
  //     props: { ...basicProps },
  //     context: defaultContext,
  //   });

  //   await vi.advanceTimersToNextTimerAsync();

  //   const paymentForm = screen.getByTestId("payment-form");
  //   await fireEvent.submit(paymentForm);
  //   await vi.advanceTimersToNextTimerAsync();

  //   expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
  //     eventName: SDKEventName.CheckoutBillingFormSubmit,
  //   });
  // });

  // test.only("tracks the PaymentEntryError event when the payment entry is submitted and failed", async () => {
  //   render(StateNeedsPaymentInfo, {
  //     props: { ...basicProps },
  //     context: defaultContext,
  //   });

  //   await vi.advanceTimersToNextTimerAsync();

  //   const paymentForm = screen.getByTestId("payment-form");
  //   await fireEvent.submit(paymentForm);
  //   await vi.advanceTimersToNextTimerAsync();

  //   expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
  //     eventName: SDKEventName.CheckoutBillingFormError,
  //   });
  // });
});
