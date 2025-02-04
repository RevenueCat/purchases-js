import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import { describe, test, expect, vi } from "vitest";
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
  purchaseOption: null,
  productDetails: rcPackage.rcBillingProduct,
  processing: false,
  paymentInfoCollectionMetadata: purchaseResponse,
  onClose: vi.fn(),
  onContinue: vi.fn(),
};

const defaultContext = new Map(
  Object.entries({ [eventsTrackerContextKey]: eventsTrackerMock }),
);

describe("PurchasesUI", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test("tracks the PaymentEntryImpression event when the payment entry is displayed", async () => {
    render(StateNeedsPaymentInfo, {
      props: { ...basicProps },
      context: defaultContext,
    });
    await vi.advanceTimersToNextTimerAsync();

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.PaymentEntryImpression,
    });
  });
});
