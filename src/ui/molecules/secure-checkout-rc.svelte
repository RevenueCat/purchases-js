<script lang="ts">
  /**
   * SecureCheckoutRC Component
   *
   * Displays footer information for the checkout process, including:
   * - Terms & conditions text that varies based on purchase type (subscription vs one-time)
   * - Subscription-specific features (trials, intro pricing)
   * - Payment security messaging
   *
   * When hideSubscriptionDisclosure is true (checkout consent active), only the
   * built-in terms paragraph and Terms link are omitted here — those render
   * beside the consent checkbox. Auto-renew copy, discount terms, and the
   * secure-checkout line stay in the footer.
   */
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import { getDurationInDays } from "../../helpers/paywall-period-helpers";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import type {
    DiscountPhase,
    PurchaseOption,
    SubscriptionOption,
  } from "../../entities/offerings";
  import { type Writable } from "svelte/store";
  import Typography from "../atoms/typography.svelte";
  import {
    buildCheckoutDisclosureContent,
    isSubscriptionOption,
  } from "../../helpers/checkout-disclosure-helper";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let purchaseOption: PurchaseOption | null = null;
  export let termsAndConditionsUrl: string | null = null;
  /** When true, hide only the terms paragraph/link that consent pulls above Pay. */
  export let hideSubscriptionDisclosure: boolean = false;

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  $: subscriptionOption = isSubscriptionOption(purchaseOption)
    ? purchaseOption
    : null;

  // TODO WEB-4205 - Translations
  const DISCOUNT_FOREVER_TERMS_INFO =
    "Discount applied to your subscription. Auto-renews at the discounted rate. Cancel anytime.";
  const DISCOUNT_ONE_TIME_TERMS_INFO =
    "Discount applies to your first payment only. Subscription auto-renews at the standard rate. Cancel anytime.";
  const DISCOUNT_ONE_CYCLE_TERMS_INFO =
    "One-time discount applied. Auto-renews at the standard rate. Cancel anytime.";
  const DISCOUNT_LIMITED_TIME_TERMS_INFO =
    "Limited-time discount. Auto-renews at the standard rate. Cancel anytime.";

  function discountOnlyAppliesToFirstBillingCycle(
    subscription: SubscriptionOption,
    discount: DiscountPhase,
  ): boolean {
    if (discount.durationMode !== "time_window") {
      return false;
    }

    const basePeriod = subscription.base.period;
    const discountPeriod = discount.period;

    if (!basePeriod || !discountPeriod || discount.cycleCount <= 0) {
      return false;
    }

    const billingCycleDays = getDurationInDays(basePeriod);
    const discountWindowDays = getDurationInDays({
      number: discountPeriod.number * discount.cycleCount,
      unit: discountPeriod.unit,
    });

    return billingCycleDays > 0 && discountWindowDays <= billingCycleDays;
  }

  function getDiscountTermsInfo(
    subscription: SubscriptionOption | null,
  ): string | null {
    const discount = subscription?.discount;

    if (!subscription || !discount) {
      return null;
    }

    switch (discount.durationMode) {
      case "forever":
        return DISCOUNT_FOREVER_TERMS_INFO;
      case "one_time":
        return DISCOUNT_ONE_CYCLE_TERMS_INFO;
      case "time_window":
        return discountOnlyAppliesToFirstBillingCycle(subscription, discount)
          ? DISCOUNT_ONE_TIME_TERMS_INFO
          : DISCOUNT_LIMITED_TIME_TERMS_INFO;
      default:
        return null;
    }
  }

  $: disclosure = buildCheckoutDisclosureContent({
    brandingInfo,
    purchaseOption,
    translator: $translator,
  });

  $: discountTermsInfo = getDiscountTermsInfo(subscriptionOption);

  $: termsInfo = discountTermsInfo ?? disclosure.disclosureText;

  $: subscriptionInfo = subscriptionOption
    ? $translator.translate(LocalizationKeys.PaymentEntryPageSubscriptionInfo)
    : null;
</script>

<div class="footer-caption-container">
  {#if discountTermsInfo || (!hideSubscriptionDisclosure && termsInfo)}
    <p class="footer-caption">
      <Typography size="caption-default">
        {termsInfo}
      </Typography>
    </p>
  {/if}
  {#if subscriptionInfo && !discountTermsInfo}
    <p class="footer-caption">
      <Typography size="caption-default">{subscriptionInfo}</Typography>
    </p>
  {/if}
  <p class="footer-caption">
    <Typography size="caption-default">
      {#if termsAndConditionsUrl && !hideSubscriptionDisclosure}
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
