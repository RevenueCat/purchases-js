import {} from "svelte";
import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import { describe, test, expect, vi, beforeEach } from "vitest";
import StateNeedsPaymentInfo from "../../../ui/states/state-needs-payment-info.svelte";
import {
  brandingInfo,
  rcPackage,
  purchaseResponse,
} from "../../../stories/fixtures";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";

const eventsTrackerMock = createEventsTrackerMock();

const basicProps = {
  brandingInfo: brandingInfo,
  purchaseOption: rcPackage.rcBillingProduct.defaultPurchaseOption,
  productDetails: rcPackage.rcBillingProduct,
  processing: false,
  paymentInfoCollectionMetadata: purchaseResponse,
  onClose: vi.fn(),
  onContinue: vi.fn(),
};

const defaultContext = new Map(
  Object.entries({ [eventsTrackerContextKey]: eventsTrackerMock }),
);

// vi.mock("@stripe/stripe-js", () => ({
//   loadStripe: vi.fn().mockResolvedValue({
//     elements: vi.fn().mockReturnValue({
//       _elements: [1],
//       create: vi.fn(),
//       update: vi.fn(),
//       mount: vi.fn(),
//     }),
//     registerAppInfo: vi.fn(),
//     confirmPayment: vi.fn().mockResolvedValue({
//       error: null,
//     }),
//     confirmSetup: vi.fn().mockResolvedValue({
//       error: null,
//     }),
//   }),
//   StripeElements: vi.fn(),
// }));

describe("PurchasesUI", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("tracks the PaymentEntryImpression event when the payment entry is displayed", async () => {
    render(StateNeedsPaymentInfo, {
      props: { ...basicProps },
      context: defaultContext,
    });

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.PaymentEntryImpression,
    });
  });

  // test("tracks the PaymentEntryDismiss event when closed", async () => {
  //   render(StateNeedsPaymentInfo, {
  //     props: { ...basicProps },
  //     context: defaultContext,
  //   });

  //   const closeButton = screen.getByRole("button", { name: "Close" });
  //   await fireEvent.click(closeButton);

  //   expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
  //     eventName: SDKEventName.PaymentEntryDismiss,
  //   });
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
  //     eventName: SDKEventName.PaymentEntrySubmit,
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
  //     eventName: SDKEventName.PaymentEntryError,
  //   });
  // });
});
