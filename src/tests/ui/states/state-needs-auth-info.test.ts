import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi } from "vitest";
import StateNeedsAuthInfo from "../../../ui/states/state-needs-auth-info.svelte";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";

const eventsTrackerMock = createEventsTrackerMock();

const defaultContext = new Map(
  Object.entries({ [eventsTrackerContextKey]: eventsTrackerMock }),
);

const basicProps = {
  lastError: null,
  processing: false,
  onClose: vi.fn(),
  onContinue: vi.fn(),
};

describe("PurchasesUI", () => {
  test("displays error when an invalid email format is submitted", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "testest.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(screen.getByText(/Email is not valid/)).toBeInTheDocument();
  });

  test("clears email format error after it is fixed", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
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

  test("tracks the BillingEmailEntryImpression on mount", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.BillingEmailEntryImpression,
    });
  });

  test("tracks the BillingEmailEntrySubmit event email is submitted", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "test@test.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.BillingEmailEntrySubmit,
    });
  });

  test("tracks the BillingEmailEntryDismiss event when closed", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const closeButton = screen.getByTestId("close-button");
    await fireEvent.click(closeButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.BillingEmailEntryDismiss,
    });
    expect(basicProps.onClose).toHaveBeenCalled();
  });

  test("tracks the BillingEmailEntryError event when input has an email format error", async () => {
    render(StateNeedsAuthInfo, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "testest.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.BillingEmailEntryError,
      properties: {
        errorCode: null,
        errorMessage:
          "Email is not valid. Please provide a valid email address.",
      },
    });
  });
});
