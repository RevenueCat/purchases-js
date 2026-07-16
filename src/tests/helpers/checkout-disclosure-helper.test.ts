import { describe, expect, test } from "vitest";
import { buildCheckoutDisclosureContent } from "../../helpers/checkout-disclosure-helper";
import { Translator } from "../../ui/localization/translator";
import {
  brandingInfo,
  nonSubscriptionOption,
  subscriptionOption,
  subscriptionOptionWithTrial,
} from "../../stories/fixtures";

describe("buildCheckoutDisclosureContent", () => {
  const translator = new Translator();

  test("builds non-trial and trial subscription disclosure text", () => {
    const nonTrial = buildCheckoutDisclosureContent({
      brandingInfo,
      purchaseOption: subscriptionOption,
      translator,
    });
    expect(nonTrial.disclosureText).toContain(brandingInfo.app_name);

    const trial = buildCheckoutDisclosureContent({
      brandingInfo,
      purchaseOption: subscriptionOptionWithTrial,
      translator,
    });
    expect(trial.disclosureText).toMatch(/\$|€|£|\d/);
  });

  test("builds one-time purchase disclosure text", () => {
    const otp = buildCheckoutDisclosureContent({
      brandingInfo,
      purchaseOption: nonSubscriptionOption,
      translator,
    });
    expect(otp.disclosureText).toContain(brandingInfo.app_name);
  });
});
