import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi } from "vitest";
import StateSuccess from "../../../ui/states/state-success.svelte";
import { brandingInfo, rcPackage } from "../../../stories/fixtures";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";

const eventsTrackerMock = createEventsTrackerMock();

const basicProps = {
  productDetails: rcPackage.rcBillingProduct,
  brandingInfo: brandingInfo,
  onContinue: vi.fn(),
};

const defaultContext = new Map(
  Object.entries({ [eventsTrackerContextKey]: eventsTrackerMock }),
);

describe("PurchasesUI", () => {
  function renderComponent() {
    render(StateSuccess, {
      props: basicProps,
      context: defaultContext,
    });
  }

  test("tracks the PurchaseSuccessfulImpression event when the purchase is successful", async () => {
    renderComponent();
    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulImpression,
    });
  });

  test("tracks the PurchaseSuccessfulDismiss event when the purchase successful dialog is closed", async () => {
    renderComponent();

    const continueButton = screen.getByTestId("close-button");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
      properties: {
        ui_element: "close",
      },
    });
  });

  test("tracks the PurchaseSuccessfulDismiss event when the purchase successful dialog button is pressed", async () => {
    renderComponent();
    const continueButton = screen.getByText("Close");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
      properties: {
        ui_element: "go_back_to_app",
      },
    });
  });
});
