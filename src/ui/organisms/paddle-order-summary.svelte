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
  import { toBcp47Locale } from "../../helpers/locale-helper";
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
  const basePeriod: Period | null = isSubscriptionOption(purchaseOption)
    ? (purchaseOption.base.period ?? null)
    : null;

  const toMicros = (amount: number): number => Math.round(amount * 1_000_000);

  const fallbackPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOption,
  );
  const currency = $derived(totals?.currencyCode ?? fallbackPrice.currency);
  const totalMicros = $derived(
    totals ? toMicros(totals.totalAmount) : fallbackPrice.amountMicros,
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

  const productName = $derived(totals?.productName ?? productDetails.title);
  const priceName = $derived(totals?.priceName ?? null);
  const hasTax = $derived(!!totals && totals.taxAmount > 0);

  // Best-effort next billing date for the recurring row: today + the base
  // period, formatted in the active locale. Reuses getNextRenewalDate so the
  // leap-year / month-overflow edge cases live in one place. The exact Paddle
  // renewal date isn't exposed through checkout events.
  const nextBillingLabel = $derived.by(() => {
    if (!totals || totals.recurringTotalAmount === null || !basePeriod)
      return null;
    const renewalDate = getNextRenewalDate(new Date(), basePeriod, true);
    if (!renewalDate) return null;
    return new Intl.DateTimeFormat(toBcp47Locale($translator.selectedLocale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(renewalDate);
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
    {#if billedFrequencyLabel}
      <Typography size="body-small">billed {billedFrequencyLabel}</Typography>
    {/if}

    <div class="rcb-paddle-summary-product">
      <Typography size="body-base">{productName}</Typography>
      {#if priceName}
        <span class="rcb-paddle-summary-muted rcb-paddle-summary-price-name"
          >{priceName}</span
        >
      {/if}
      <div class="rcb-paddle-summary-product-price">
        <span>{formatAmount(totalMicros)}</span>
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
      {#if totals.recurringTotalAmount !== null && nextBillingLabel}
        <div class="rcb-paddle-summary-row">
          <span class="rcb-paddle-summary-muted">Due on {nextBillingLabel}</span
          >
          <span>{formatAmount(toMicros(totals.recurringTotalAmount))}</span>
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
