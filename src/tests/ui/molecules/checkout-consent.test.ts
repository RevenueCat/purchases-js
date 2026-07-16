import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import { writable } from "svelte/store";
import CheckoutConsent from "../../../ui/molecules/checkout-consent.svelte";
import { Translator } from "../../../ui/localization/translator";
import { translatorContextKey } from "../../../ui/localization/constants";
import { LocalizationKeys } from "../../../ui/localization/supportedLanguages";
import {
  brandingInfo,
  subscriptionOption,
  subscriptionOptionWithTrial,
} from "../../../stories/fixtures";

const renderConsent = (
  props: Record<string, unknown> = {},
  translator = new Translator(),
) => {
  return render(CheckoutConsent, {
    props: {
      brandingInfo,
      purchaseOption: subscriptionOption,
      termsAndConditionsUrl: "https://example.com/terms",
      ...props,
    },
    context: new Map(
      Object.entries({
        [translatorContextKey]: writable(translator),
      }),
    ),
  });
};

describe("CheckoutConsent", () => {
  test("renders localized non-trial disclosure with interpolated app name", () => {
    renderConsent();

    const disclosure = screen.getByTestId("checkout-consent-disclosure");
    expect(disclosure.textContent).toContain(brandingInfo.app_name!);
    expect(disclosure.textContent).toMatch(/subscribing|agree/i);
  });

  test("renders trial disclosure for trial purchase options", () => {
    renderConsent({ purchaseOption: subscriptionOptionWithTrial });

    expect(
      screen.getByTestId("checkout-consent-disclosure").textContent,
    ).toMatch(/trial|charged/i);
  });

  test("interpolates custom labelsOverride variables and leaves unknowns unresolved", () => {
    const translator = new Translator({
      en: {
        [LocalizationKeys.PaymentEntryPageSubscriptionTermsInfo]:
          "Custom {{appName}} at {{price}} {{missingVar}}",
      },
    });

    renderConsent({}, translator);

    const text = screen.getByTestId("checkout-consent-disclosure").textContent;
    expect(text).toContain("Custom");
    expect(text).toContain(brandingInfo.app_name!);
    expect(text).toContain("{{missingVar}}");
  });

  test("renders merchant HTML as escaped text, not markup", () => {
    const translator = new Translator({
      en: {
        [LocalizationKeys.PaymentEntryPageSubscriptionTermsInfo]:
          "Agree <img src=x onerror=alert(1)> {{appName}}",
      },
    });

    renderConsent({}, translator);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("checkout-consent-disclosure").textContent,
    ).toContain("<img src=x onerror=alert(1)>");
  });

  test("renders Terms link when URL is provided", () => {
    renderConsent({
      termsAndConditionsUrl: "https://example.com/terms",
    });

    const link = screen.getByTestId("checkout-consent-terms-link");
    expect(link).toHaveAttribute("href", "https://example.com/terms");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("associates checkbox with label via id/for", () => {
    renderConsent();

    const checkbox = screen.getByTestId("checkout-consent-checkbox");
    const label = checkbox
      .closest(".rc-checkout-consent")
      ?.querySelector("label");

    expect(label).toHaveAttribute("for", checkbox.id);
    expect(checkbox).toHaveAttribute("aria-describedby");
  });

  test("supports keyboard toggling of the checkbox", async () => {
    renderConsent();

    const checkbox = screen.getByTestId("checkout-consent-checkbox");
    expect(checkbox).not.toBeChecked();

    checkbox.focus();
    await fireEvent.keyDown(checkbox, { key: " " });
    await fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
