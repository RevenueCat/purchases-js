import { describe, expect, it } from "vitest";
import { buildPaywallMountProps } from "../../helpers/paywall-mount-props";
import { fixtureOffering } from "../fixtures/paywall-fixtures";

describe("buildPaywallMountProps", () => {
  it("produces a stable prop bag for a fixture offering", () => {
    const result = buildPaywallMountProps({
      offering: fixtureOffering(),
      selectedLocale: "en_US",
      hideBackButtons: false,
      customVariables: undefined,
    });

    expect({
      selectedLocale: result.selectedLocale,
      defaultLocale: result.defaultLocale,
      hideBackButtons: result.hideBackButtons,
      paywallDataId: result.paywallData.id,
      uiConfigKeys: Object.keys(result.uiConfig ?? {}).sort(),
      packageIds: Object.keys(result.infoPerPackage).sort(),
    }).toMatchSnapshot();
  });

  it("falls back to the paywall's default_locale when selectedLocale is unsupported", () => {
    const result = buildPaywallMountProps({
      offering: fixtureOffering(),
      selectedLocale: "xx_YY",
      hideBackButtons: false,
      customVariables: undefined,
    });

    expect(result.selectedLocale).toBe(result.defaultLocale);
  });
});
