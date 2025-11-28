<script lang="ts">
  /**
   * SecureCheckoutRC Component
   *
   * Displays footer information for the checkout process, including:
   * - Terms & conditions text that varies based on purchase type (subscription vs one-time)
   * - Subscription-specific features (trials, intro pricing)
   * - Payment security messaging
   *
   * The component automatically selects the appropriate terms text based on:
   * - Whether it's a subscription or one-time purchase
   * - Whether there's a free trial period
   * - Whether there's an introductory price
   * - Whether intro pricing is paid upfront or recurring
   */
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import { formatPrice } from "../../helpers/price-labels";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type {
    PurchaseOption,
    SubscriptionOption,
    NonSubscriptionOption,
  } from "../../entities/offerings";
  import { type Writable } from "svelte/store";
  import Typography from "../atoms/typography.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let purchaseOption: PurchaseOption | null = null;
  export let termsAndConditionsUrl: string | null = null;

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  function isSubscriptionOption(
    option: PurchaseOption | null,
  ): option is SubscriptionOption {
    return option != null && "base" in option;
  }

  function isNonSubscriptionOption(
    option: PurchaseOption | null,
  ): option is NonSubscriptionOption {
    return option != null && "basePrice" in option;
  }

  $: subscriptionOption = isSubscriptionOption(purchaseOption)
    ? purchaseOption
    : null;
  $: nonSubscriptionOption = isNonSubscriptionOption(purchaseOption)
    ? purchaseOption
    : null;

  $: termsKey = getTermsLocalizationKey(subscriptionOption);

  function getTermsLocalizationKey(
    subscription: SubscriptionOption | null,
  ): LocalizationKeys {
    if (!subscription) {
      return LocalizationKeys.PaymentEntryPageOtpTermsInfo;
    }

    const hasTrial = !!subscription.trial;

    if (hasTrial) {
      return LocalizationKeys.PaymentEntryPageTrialSubscriptionTermsInfo;
    }

    return LocalizationKeys.PaymentEntryPageSubscriptionTermsInfo;
  }

  $: firstSubscriptionPricingPhase =
    subscriptionOption?.introPrice || subscriptionOption?.base;

  $: firstPaymentPrice =
    nonSubscriptionOption?.basePrice || firstSubscriptionPricingPhase?.price;

  $: firstPriceFormatted = firstPaymentPrice
    ? formatPrice(
        firstPaymentPrice.amountMicros,
        firstPaymentPrice.currency,
        $translator.bcp47Locale || $translator.fallbackBcp47Locale,
      )
    : null;

  $: perFrequency = firstSubscriptionPricingPhase?.period
    ? $translator.translatePeriodFrequency(
        firstSubscriptionPricingPhase?.period?.number || 1,
        firstSubscriptionPricingPhase?.period?.unit,
        { useMultipleWords: true },
      )
    : null;

  $: renewalDate = subscriptionOption?.trial?.period
    ? $translator.translateDate(
        getNextRenewalDate(
          new Date(),
          subscriptionOption.trial.period,
          true,
        ) as Date,
        { year: "numeric", month: "long", day: "numeric" },
      )
    : null;

  $: termsInfo =
    brandingInfo && firstPaymentPrice
      ? $translator.translate(termsKey, {
          appName: brandingInfo?.app_name,
          price: firstPriceFormatted,
          perFrequency,
          renewalDate,
        })
      : null;

  $: subscriptionInfo = subscriptionOption
    ? $translator.translate(LocalizationKeys.PaymentEntryPageSubscriptionInfo)
    : null;
</script>

<div class="footer-caption-container">
  {#if termsInfo}
    <p class="footer-caption">
      <Typography size="caption-default">
        {termsInfo}
      </Typography>
    </p>
  {/if}
  {#if subscriptionInfo}
    <p class="footer-caption">
      <Typography size="caption-default">{subscriptionInfo}</Typography>
    </p>
  {/if}
  <p class="footer-caption">
    <Typography size="caption-default">
      {#if termsAndConditionsUrl}
        <a
          class="terms-link"
          href={termsAndConditionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Localized key={LocalizationKeys.PaymentEntryPageTermsLinkLabel} />
        </a>
        <span class="terms-divider">{"|"}</span>
      {/if}
      <Localized key={LocalizationKeys.PaymentEntryPagePaymentStepTitle} />
    </Typography>
  </p>
</div>

<style>
  .footer-caption-container {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile);
  }

  .footer-caption {
    color: var(--rc-color-grey-text-light);
    text-align: center;
    margin: 0;
  }

  .terms-link {
    color: inherit;
  }

  .terms-divider {
    margin: 0 4px;
  }

  @container layout-query-container (width >= 768px) {
    .footer-caption-container {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
