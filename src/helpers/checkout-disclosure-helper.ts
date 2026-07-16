import type {
  NonSubscriptionOption,
  PurchaseOption,
  SubscriptionOption,
} from "../entities/offerings";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import { getNextRenewalDate } from "./duration-helper";
import { formatPrice } from "./price-labels";
import { LocalizationKeys } from "../ui/localization/supportedLanguages";
import type { Translator } from "../ui/localization/translator";

export function isSubscriptionOption(
  option: PurchaseOption | null | undefined,
): option is SubscriptionOption {
  return option != null && "base" in option;
}

export function isNonSubscriptionOption(
  option: PurchaseOption | null | undefined,
): option is NonSubscriptionOption {
  return option != null && "basePrice" in option;
}

/**
 * Localized checkout terms paragraph (trial / non-trial / one-time).
 * Shared by the consent checkbox and secure-checkout footer.
 */
export function buildCheckoutDisclosureContent(params: {
  brandingInfo: BrandingInfoResponse | null;
  purchaseOption: PurchaseOption | null;
  translator: Translator;
}): { disclosureText: string | null } {
  const { brandingInfo, purchaseOption, translator } = params;
  if (!brandingInfo) {
    return { disclosureText: null };
  }

  const subscriptionOption = isSubscriptionOption(purchaseOption)
    ? purchaseOption
    : null;
  const nonSubscriptionOption = isNonSubscriptionOption(purchaseOption)
    ? purchaseOption
    : null;

  const termsKey = subscriptionOption
    ? subscriptionOption.trial
      ? LocalizationKeys.PaymentEntryPageTrialSubscriptionTermsInfo
      : LocalizationKeys.PaymentEntryPageSubscriptionTermsInfo
    : LocalizationKeys.PaymentEntryPageOtpTermsInfo;

  const firstSubscriptionPricingPhase =
    subscriptionOption?.discount ??
    subscriptionOption?.introPrice ??
    subscriptionOption?.base ??
    null;

  const firstPaymentPrice =
    nonSubscriptionOption?.discount?.price ||
    nonSubscriptionOption?.basePrice ||
    firstSubscriptionPricingPhase?.price;

  if (!firstPaymentPrice) {
    return { disclosureText: null };
  }

  const price = formatPrice(
    firstPaymentPrice.amountMicros,
    firstPaymentPrice.currency,
    translator.bcp47Locale || translator.fallbackBcp47Locale,
  );

  const perFrequency = firstSubscriptionPricingPhase?.period
    ? translator.translatePeriodFrequency(
        firstSubscriptionPricingPhase.period.number || 1,
        firstSubscriptionPricingPhase.period.unit,
        { useMultipleWords: true },
      )
    : null;

  const renewalDate = subscriptionOption?.trial?.period
    ? (translator.translateDate(
        getNextRenewalDate(
          new Date(),
          subscriptionOption.trial.period,
          true,
        ) as Date,
        { year: "numeric", month: "long", day: "numeric" },
      ) ?? null)
    : null;

  return {
    disclosureText: translator.translate(termsKey, {
      appName: brandingInfo.app_name,
      price,
      perFrequency,
      renewalDate,
    }),
  };
}
