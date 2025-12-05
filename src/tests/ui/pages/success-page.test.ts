import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi } from "vitest";
import SuccessPage from "../../../ui/pages/success-page.svelte";
import { brandingInfo, rcPackage } from "../../../stories/fixtures";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";
import { Translator } from "../../../ui/localization/translator";
import { writable } from "svelte/store";
import { translatorContextKey } from "../../../ui/localization/constants";
import { defaultPurchaseMode } from "../../../behavioural-events/event";

const eventsTrackerMock = createEventsTrackerMock();

const basicProps = {
  productDetails: rcPackage.rcBillingProduct,
  brandingInfo: brandingInfo,
  onContinue: vi.fn(),
};

const defaultContext = new Map(
  Object.entries({
    [eventsTrackerContextKey]: eventsTrackerMock,
    [translatorContextKey]: writable(new Translator()),
  }),
);

describe("PurchasesUI", () => {
  function renderComponent() {
    render(SuccessPage, {
      props: basicProps,
      context: defaultContext,
    });
  }

  test("tracks the PurchaseSuccessfulImpression event when the purchase is successful", async () => {
    renderComponent();
    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulImpression,
      properties: {
        mode: defaultPurchaseMode,
      },
    });
  });

  test("tracks the PurchaseSuccessfulDismiss event when the purchase successful dialog button is pressed", async () => {
    renderComponent();
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutPurchaseSuccessfulDismiss,
      properties: {
        mode: defaultPurchaseMode,
        ui_element: "go_back_to_app",
      },
    });
  });
});
