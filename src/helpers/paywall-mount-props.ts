import { Translator } from "../ui/localization/translator";
import type {
  CustomVariables,
  PaywallData,
  UIConfig,
} from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";
import { buildVariablesPerPackage } from "./paywall-variables-helpers";
import { parseOfferingIntoPackageInfoPerPackage } from "./paywall-package-info-helpers";

export interface PaywallMountPropsInput {
  offering: Offering;
  selectedLocale: string;
  hideBackButtons: boolean;
  customVariables?: CustomVariables;
}

export interface PaywallMountProps {
  paywallData: PaywallData;
  uiConfig: UIConfig;
  selectedLocale: string;
  defaultLocale: string;
  variablesPerPackage: ReturnType<typeof buildVariablesPerPackage>;
  infoPerPackage: ReturnType<typeof parseOfferingIntoPackageInfoPerPackage>;
  customVariables: CustomVariables | undefined;
  hideBackButtons: boolean;
}

function calculateLocale(
  paywallData: PaywallData,
  selectedLocale: string,
): string {
  const localesSupportedByPaywall: { [key: string]: string[] } = {};

  const toLocalePrefix = (potentialLocale: string) => {
    return potentialLocale.toLowerCase().split("_")[0];
  };

  Object.keys(paywallData.components_localizations).forEach((l) => {
    if (localesSupportedByPaywall[toLocalePrefix(l)] === undefined) {
      localesSupportedByPaywall[toLocalePrefix(l)] = [];
    }
    localesSupportedByPaywall[toLocalePrefix(l)].push(l);
  });

  const localesGroup =
    localesSupportedByPaywall[toLocalePrefix(selectedLocale)];
  if (!localesGroup) {
    return paywallData.default_locale;
  }

  const bestMatch = localesGroup.find(
    (l) => l.toLowerCase() === selectedLocale,
  );

  if (bestMatch) {
    return bestMatch;
  }

  // Finding best match for the selected locale group.
  return localesGroup[0];
}

export function buildPaywallMountProps(
  input: PaywallMountPropsInput,
): PaywallMountProps {
  const { offering, selectedLocale, hideBackButtons, customVariables } = input;

  if (!offering.paywallComponents) {
    throw new Error("This offering doesn't have a paywall attached.");
  }

  if (!offering.uiConfig) {
    throw new Error(
      "No ui_config found for this offering, please contact support!",
    );
  }

  const paywallData = offering.paywallComponents;
  const finalLocale = calculateLocale(paywallData, selectedLocale);

  const translator = new Translator(
    {},
    finalLocale,
    paywallData.default_locale,
  );

  const variablesPerPackage = buildVariablesPerPackage(offering, {
    translator,
  });
  const infoPerPackage = parseOfferingIntoPackageInfoPerPackage(offering);

  return {
    paywallData,
    uiConfig: offering.uiConfig,
    selectedLocale: finalLocale,
    defaultLocale: paywallData.default_locale,
    variablesPerPackage,
    infoPerPackage,
    customVariables,
    hideBackButtons,
  };
}
