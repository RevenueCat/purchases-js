<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import Typography from "../atoms/typography.svelte";
  import { Theme } from "../theme/theme";
  import { translatorContextKey } from "../localization/constants";
  import { Translator } from "../localization/translator";
  import { getInitialPriceFromPurchaseOption } from "../../helpers/purchase-option-price-helper";
  import type { BrandingInfoResponse } from "../../networking/responses/branding-response";
  import {
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import {
    getNextRenewalDate,
    type Period,
  } from "../../helpers/duration-helper";
  import {
    getOfferDuration,
    type OfferPhase,
  } from "../../helpers/paywall-offer-helpers";
  import { getPeriodDurationLabel } from "../../helpers/price-labels";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import type { PaddleCheckoutTotals } from "../../paddle/paddle-service";

  interface Props {
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    purchaseOption: PurchaseOption;
    // Live order totals from Paddle's checkout events (null until the inline
    // checkout reports them); drives the breakdown + recurring amount.
    totals: PaddleCheckoutTotals | null;
  }

  const { brandingInfo, productDetails, purchaseOption, totals }: Props =
    $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  // Card chrome from the branding/appearance config: form background for the
  // cards, primary (buttons) color for the amount. Corner radius is generous to
  // match the hosted overlay summary.
  const theme = new Theme(brandingInfo?.appearance ?? null);
  const cardBackground = theme.formColors.background;

  // Type guard instead of an unchecked `as SubscriptionOption` cast: only
  // subscription options expose `base`, which carries the renewal period.
  const isSubscriptionOption = (
    option: PurchaseOption,
  ): option is SubscriptionOption => "base" in option;
  const subscriptionOption: SubscriptionOption | null = $derived(
    isSubscriptionOption(purchaseOption) ? purchaseOption : null,
  );
  const basePeriod: Period | null = $derived(
    subscriptionOption?.base.period ?? null,
  );

  // The first phase the customer actually pays for, which is what today's total
  // covers and what determines when the recurring price kicks in. Matches the
  // precedence in paywall-offer-helpers' setOfferVariables. (secure-checkout-rc
  // and purchase-option-price-helper deliberately omit the trial: they quote a
  // price, and a trial has none.)
  const offerPhase: OfferPhase | null = $derived(
    subscriptionOption?.discount ??
      subscriptionOption?.trial ??
      subscriptionOption?.introPrice ??
      null,
  );
  // A "forever" discount has no end, so getOfferDuration returns null and we
  // fall back to the base cadence — which is correct, it renews at that rate.
  const firstPeriod: Period | null = $derived(
    (offerPhase ? getOfferDuration(offerPhase) : null) ?? basePeriod,
  );
  // A phase sitting between the first one and the base price — the same
  // "secondaryOffer" paywall-offer-helpers models. Only a trial can have one:
  // a discount supersedes both the trial and the intro price.
  const middlePhase = $derived(
    subscriptionOption?.trial && !subscriptionOption.discount
      ? (subscriptionOption.introPrice ?? null)
      : null,
  );
  // Paddle's recurring total is the base price, so "then <recurring>" only
  // holds when the first phase steps straight up to it. With a middle phase the
  // next charge is that phase's price, which these two totals cannot express,
  // so say nothing about the future rather than quote a price that is not next.
  const hasUndescribedMiddlePhase = $derived(middlePhase !== null);

  const toMicros = (amount: number): number => Math.round(amount * 1_000_000);

  const fallbackPrice = $derived(
    getInitialPriceFromPurchaseOption(productDetails, purchaseOption),
  );
  const currency = $derived(totals?.currencyCode ?? fallbackPrice.currency);
  const totalMicros = $derived(
    totals ? toMicros(totals.totalAmount) : fallbackPrice.amountMicros,
  );
  // What the customer pays each period once any intro/trial phase is over.
  const recurringMicros = $derived(
    totals?.recurringTotalAmount != null && !hasUndescribedMiddlePhase
      ? toMicros(totals.recurringTotalAmount)
      : null,
  );
  // Comparing the two amounts Paddle reports is a more direct signal than
  // comparing periods: it also catches a same-length offer (a first month at
  // $3 against a $20 monthly base), which a period comparison would miss.
  const stepsUpToRecurring = $derived(
    recurringMicros !== null && recurringMicros !== totalMicros,
  );

  const formatAmount = (micros: number): string =>
    $translator.formatPrice(micros, currency);

  const periodUnitLabel = $derived(
    basePeriod ? $translator.translatePeriodUnit(basePeriod.unit) : null,
  );
  const billedFrequencyLabel = $derived(
    basePeriod
      ? $translator.translatePeriodFrequency(basePeriod.number, basePeriod.unit)
      : null,
  );

  // "first week" rather than "first 1 week" — the shared helper keeps that
  // collapse gated to English, where the surrounding copy needs it.
  const firstPeriodLabel = $derived(
    getPeriodDurationLabel(firstPeriod, $translator, {
      collapseSingularInEnglish: true,
    }),
  );

  // The headline amount is today's total, so a bare "billed monthly" underneath
  // would read as "$3.00 monthly" while the customer is still in a 1-week intro
  // phase. Spell out the intro window and the price it steps up to instead.
  const billedSummaryLabel = $derived(
    !billedFrequencyLabel
      ? null
      : stepsUpToRecurring && firstPeriodLabel
        ? `first ${firstPeriodLabel}, then ${formatAmount(recurringMicros!)} ${billedFrequencyLabel}`
        : `billed ${billedFrequencyLabel}`,
  );

  const productName = $derived(totals?.productName ?? productDetails.title);
  const priceName = $derived(totals?.priceName ?? null);
  const hasTax = $derived(!!totals && totals.taxAmount > 0);

  // Best-effort next billing date for the recurring row: today + the first
  // phase's duration (the intro/trial window when there is one, otherwise the
  // base period). Reuses getNextRenewalDate so the leap-year / month-overflow
  // edge cases live in one place.
  //
  // The period comes from the RevenueCat catalog rather than Paddle because
  // Paddle's checkout events don't carry it: `items[].billing_cycle` is the
  // recurring cycle and `items[].trial_period` only covers free trials, so
  // neither describes a paid intro window.
  const nextBillingLabel = $derived.by(() => {
    if (recurringMicros === null || !firstPeriod) return null;
    const renewalDate = getNextRenewalDate(new Date(), firstPeriod, true);
    if (!renewalDate) return null;
    return $translator.translateDate(renewalDate, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });
</script>

<div class="rcb-paddle-summary" style="--rcb-card-bg: {cardBackground};">
  <!-- Product card -->
  <div class="rcb-paddle-summary-card">
    <div class="rcb-paddle-summary-amount-row">
      <span class="rcb-paddle-summary-amount">{formatAmount(totalMicros)}</span>
      {#if hasTax}
        <span class="rcb-paddle-summary-muted">inc. tax</span>
      {/if}
    </div>
    {#if billedSummaryLabel}
      <Typography size="body-small">{billedSummaryLabel}</Typography>
    {/if}

    <div class="rcb-paddle-summary-product">
      <Typography size="body-base">{productName}</Typography>
      {#if priceName}
        <span class="rcb-paddle-summary-muted rcb-paddle-summary-price-name"
          >{priceName}</span
        >
      {/if}
      <div class="rcb-paddle-summary-product-price">
        <!-- The recurring price, not today's total: this row is suffixed with
             "/ month", which describes what each period costs once any intro
             phase is over. Today's charge is the headline amount and the
             "Total due today" row. -->
        <span>{formatAmount(recurringMicros ?? totalMicros)}</span>
        {#if periodUnitLabel}
          <span class="rcb-paddle-summary-muted">/ {periodUnitLabel}</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Totals breakdown card -->
  {#if totals}
    <div class="rcb-paddle-summary-card">
      <div class="rcb-paddle-summary-row">
        <span class="rcb-paddle-summary-muted"
          >{$translator.translate(LocalizationKeys.PricingTableSubtotal)}</span
        >
        <span>{formatAmount(toMicros(totals.subtotalAmount))}</span>
      </div>
      {#if hasTax}
        <div class="rcb-paddle-summary-row">
          <span class="rcb-paddle-summary-muted"
            >{$translator.translate(LocalizationKeys.PricingTableTax)}</span
          >
          <span>{formatAmount(toMicros(totals.taxAmount))}</span>
        </div>
      {/if}
      <hr class="rcb-paddle-summary-divider" />
      <div class="rcb-paddle-summary-row rcb-paddle-summary-row-strong">
        <span
          >{$translator.translate(
            LocalizationKeys.PricingTableTotalDueToday,
          )}</span
        >
        <span>{formatAmount(toMicros(totals.totalAmount))}</span>
      </div>
      {#if recurringMicros !== null && nextBillingLabel}
        <div class="rcb-paddle-summary-row">
          <span class="rcb-paddle-summary-muted">Due on {nextBillingLabel}</span
          >
          <span>{formatAmount(recurringMicros)}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .rcb-paddle-summary {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapLarge-mobile, 16px);
    width: 100%;
  }

  .rcb-paddle-summary-card {
    background: var(--rcb-card-bg);
    border-radius: 16px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile, 12px);
  }

  .rcb-paddle-summary-amount-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .rcb-paddle-summary-amount {
    color: var(--rc-color-primary);
    font-weight: 700;
    font-size: 2rem;
    line-height: 1.1;
  }

  .rcb-paddle-summary-product {
    display: flex;
    flex-direction: column;
    gap: 2px;
    /* Extra separation between the amount/billing line and the product block. */
    margin-top: var(--rc-spacing-gapLarge-mobile, 16px);
  }

  .rcb-paddle-summary-price-name {
    font-size: 0.8125rem;
  }

  .rcb-paddle-summary-product-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-weight: 600;
    font-size: 1.25rem;
    /* A bit more separation from the price-name line above. */
    margin-top: var(--rc-spacing-gapSmall-mobile, 8px);
  }

  .rcb-paddle-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rcb-paddle-summary-row-strong {
    font-weight: 700;
  }

  .rcb-paddle-summary-muted {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-paddle-summary-divider {
    border: none;
    border-top: 1px solid var(--rc-color-grey-ui-light);
    margin: 4px 0;
    width: 100%;
  }
</style>
