<script lang="ts">
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

  $: termsKey = !subscriptionOption
    ? LocalizationKeys.PaymentEntryPageOtpTermsInfo
    : subscriptionOption.trial
      ? LocalizationKeys.PaymentEntryPageTrialSubscriptionTermsInfo
      : LocalizationKeys.PaymentEntryPageNonTrialSubscriptionTermsInfo;

  $: basePrice =
    nonSubscriptionOption?.basePrice || subscriptionOption?.base?.price;

  $: basePriceFormatted = basePrice
    ? formatPrice(
        basePrice.amountMicros,
        basePrice.currency,
        $translator.locale || $translator.fallbackLocale,
      )
    : null;

  $: perFrequency = subscriptionOption?.base?.period
    ? $translator.translatePeriodFrequency(
        subscriptionOption?.base?.period?.number || 1,
        subscriptionOption?.base?.period?.unit,
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
    brandingInfo && basePrice
      ? $translator.translate(termsKey, {
          appName: brandingInfo?.app_name,
          price: basePriceFormatted,
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
      <Typography size="caption-default">{termsInfo}</Typography>
    </p>
  {/if}
  {#if subscriptionInfo}
    <p class="footer-caption">
      <Typography size="caption-default">{subscriptionInfo}</Typography>
    </p>
  {/if}
  <p class="footer-caption">
    <Typography size="caption-default">
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

  @container layout-query-container (width >= 768px) {
    .footer-caption-container {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
