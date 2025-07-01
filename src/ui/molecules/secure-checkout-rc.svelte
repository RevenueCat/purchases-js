<script lang="ts">
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import { formatPrice } from "../../helpers/price-labels";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type { SubscriptionOption } from "../../entities/offerings";
  import { type Writable } from "svelte/store";
  import Typography from "../atoms/typography.svelte";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let subscriptionOption: SubscriptionOption | null = null;

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  $: termsInfo = brandingInfo
    ? $translator.translate(LocalizationKeys.PaymentEntryPageTermsInfo, {
        appName: brandingInfo?.app_name,
      })
    : null;

  $: trialInfo =
    subscriptionOption?.base?.price &&
    subscriptionOption?.trial?.period &&
    subscriptionOption?.base?.period &&
    subscriptionOption?.base?.period?.unit
      ? $translator.translate(LocalizationKeys.PaymentEntryPageTrialInfo, {
          price: formatPrice(
            subscriptionOption?.base?.price.amountMicros,
            subscriptionOption?.base?.price.currency,
            $translator.locale || $translator.fallbackLocale,
          ),
          perFrequency: $translator.translatePeriodFrequency(
            subscriptionOption?.base?.period?.number || 1,
            subscriptionOption?.base?.period?.unit,
            { useMultipleWords: true },
          ),
          renewalDate: $translator.translateDate(
            getNextRenewalDate(
              new Date(),
              subscriptionOption.trial.period || subscriptionOption.base.period,
              true,
            ) as Date,
            { year: "numeric", month: "long", day: "numeric" },
          ),
        })
      : null;
</script>

<div class="footer-caption-container">
  {#if termsInfo && subscriptionOption}
    <p class="footer-caption">
      <Typography size="caption-default">{termsInfo}</Typography>
    </p>
  {/if}
  {#if trialInfo}
    <p class="footer-caption">
      <Typography size="caption-default">{trialInfo}</Typography>
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
