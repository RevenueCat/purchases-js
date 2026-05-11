import type { PaywallData } from "@revenuecat/purchases-ui-js";
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
  return { app: { fonts: {} } } as Offering["uiConfig"];
}

/**
 * Minimal PaywallData fixture with a real stack hierarchy so tests can assert
 * component ids are present in the extracted layout.
 *
 * Only "text" and "image" leaf types are used because the Paywall component's
 * internal tree walker returns [] for unknown/leaf types, avoiding traversal
 * errors from incomplete component shapes (e.g. missing nested stacks).
 */
export function fixturePaywallData(): PaywallData {
  return {
    id: "fixture-paywall-id",
    default_locale: "en_US",
    components_localizations: {
      en_US: {},
    },
    components_config: {
      base: {
        stack: {
          id: "root-stack",
          type: "stack",
          components: [
            {
              id: "child-text-1",
              type: "text",
            },
            {
              id: "child-text-2",
              type: "text",
            },
          ],
        } as PaywallData["components_config"]["base"]["stack"],
      },
    },
  } as unknown as PaywallData;
}
