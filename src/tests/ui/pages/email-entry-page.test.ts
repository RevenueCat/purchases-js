import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, test, expect, vi } from "vitest";
import EmailEntryPage from "../../../ui/pages/email-entry-page.svelte";
import { SDKEventName } from "../../../behavioural-events/sdk-events";
import { createEventsTrackerMock } from "../../mocks/events-tracker-mock-provider";
import { eventsTrackerContextKey } from "../../../ui/constants";
import { writable } from "svelte/store";
import { Translator } from "../../../ui/localization/translator";
import { translatorContextKey } from "../../../ui/localization/constants";

const eventsTrackerMock = createEventsTrackerMock();

const defaultContext = new Map(
  Object.entries({
    [eventsTrackerContextKey]: eventsTrackerMock,
    [translatorContextKey]: writable(new Translator()),
  }),
);

const basicProps = {
  lastError: null,
  processing: false,
  onClose: vi.fn(),
  onContinue: vi.fn(),
};

describe("PurchasesUI", () => {
  test("displays error when an invalid email format is submitted", async () => {
    render(EmailEntryPage, {
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
    render(EmailEntryPage, {
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

  test("tracks the CheckoutBillingFormImpression on mount", async () => {
    render(EmailEntryPage, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutBillingFormImpression,
    });
  });

  test("tracks the CheckoutBillingFormSubmit event email is submitted", async () => {
    render(EmailEntryPage, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "test@test.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutBillingFormSubmit,
    });
  });

  test("tracks the CheckoutBillingFormError event when input has an email format error", async () => {
    render(EmailEntryPage, {
      props: { ...basicProps, customerEmail: undefined },
      context: defaultContext,
    });

    const emailInput = screen.getByTestId("email");
    await fireEvent.input(emailInput, { target: { value: "testest.com" } });
    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(eventsTrackerMock.trackSDKEvent).toHaveBeenCalledWith({
      eventName: SDKEventName.CheckoutBillingFormError,
      properties: {
        errorCode: null,
        errorMessage:
          "Email is not valid. Please provide a valid email address.",
      },
    });
  });
});
