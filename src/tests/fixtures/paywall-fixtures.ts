import type { Offering } from "../../entities/offerings";
import { createMonthlyPackageMock } from "../mocks/offering-mock-provider";

/**
 * Minimal Offering fixture carrying paywallComponents (PaywallData) and uiConfig.
 * Used by paywall-mount-props tests and any other test that needs a fully-formed offering.
 */
export function fixtureOffering(
  availablePackages = [createMonthlyPackageMock()],
): Offering {
  const monthlyPackage =
    availablePackages.find((pkg) => pkg.identifier === "$rc_monthly") ??
    availablePackages[0]!;

  return {
    identifier: "fixture-offering-id",
    serverDescription: "fixture offering",
    metadata: null,
    packagesById: Object.fromEntries(
      availablePackages.map((pkg) => [pkg.identifier, pkg]),
    ),
    availablePackages,
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: monthlyPackage,
    weekly: null,
    hasPaywall: true,
    paywallComponents: {
      id: "fixture-paywall-id",
      default_locale: "en_US",
      components_localizations: {
        en_US: {},
      },
    } as unknown as Offering["paywallComponents"],
    uiConfig: {} as Offering["uiConfig"],
  };
}

export function fixtureUiConfig(): Offering["uiConfig"] {
  return {} as Offering["uiConfig"];
}
