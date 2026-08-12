<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type {
    SubscriptionChangeCheckoutStartResponse,
    SubscriptionChangePriceBreakdownSummary,
    SubscriptionChangeProductSummary,
  } from "../../networking/responses/subscription-change-response";
  import type {
    PurchaseOption,
    SubscriptionOption,
  } from "../../entities/offerings";
  import type { PriceBreakdown } from "../ui-types";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import PricingTable from "../molecules/pricing-table.svelte";
  import PlanCard from "../molecules/plan-card.svelte";
  import RefundForUnusedTime from "../molecules/refund-for-unused-time.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
    purchaseOption?: PurchaseOption | null;
  }

  let { startData, purchaseOption = null }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const fromTitle = $derived(
    startData.from_product.display_name ?? startData.from_product.product_id,
  );
  const toTitle = $derived(
    startData.to_product.display_name ?? startData.to_product.product_id,
  );

  const pageTitle = $derived(
    startData.change_type === "deferred"
      ? "Change your subscription"
      : "Upgrade your subscription",
  );

  function isSubscriptionOption(
    option: PurchaseOption | null,
  ): option is SubscriptionOption {
    return option != null && "base" in option;
  }

  const billingPeriod = $derived(
    isSubscriptionOption(purchaseOption) ? purchaseOption.base.period : null,
  );

  function formatProductPrice(
    product: SubscriptionChangeProductSummary,
  ): string {
    const formattedPrice = $translator.formatPrice(
      product.price_in_micros,
      product.currency,
    );
    const period = billingPeriod;
    if (!period) {
      return formattedPrice;
    }

    const periodLabel =
      period.number === 1
        ? $translator.translatePeriodUnit(period.unit, {
            noWhitespace: true,
            short: true,
          })
        : $translator.translatePeriod(period.number, period.unit, {
            noWhitespace: true,
            short: true,
          });

    if (!periodLabel) {
      return formattedPrice;
    }

    return (
      $translator.translate(LocalizationKeys.PaywallVariablesPricePerPeriod, {
        formattedPrice,
        period: periodLabel,
      }) ?? `${formattedPrice}/${periodLabel}`
    );
  }

  const fromPrice = $derived(formatProductPrice(startData.from_product));
  const toPrice = $derived(formatProductPrice(startData.to_product));

  function toPriceBreakdown(
    summary: SubscriptionChangePriceBreakdownSummary,
  ): PriceBreakdown {
    const taxAmount = summary.tax_amount_in_micros;
    return {
      currency: summary.currency,
      totalAmountInMicros: summary.total_amount_in_micros,
      totalExcludingTaxInMicros: summary.total_excluding_tax_in_micros,
      originalAmountInMicros: summary.original_amount_in_micros ?? undefined,
      taxAmountInMicros: taxAmount,
      taxCalculationStatus: taxAmount != null ? "calculated" : "pending",
      taxBreakdown:
        taxAmount != null
          ? [
              {
                display_name: "Tax (estimated)",
                tax_amount_in_micros: taxAmount,
              },
            ]
          : null,
    };
  }

  const priceBreakdown = $derived.by((): PriceBreakdown => {
    const summary =
      startData.price_breakdown ?? startData.estimated_renewal_price;
    if (summary) {
      return toPriceBreakdown(summary);
    }
    return {
      currency: startData.to_product.currency,
      totalAmountInMicros: 0,
      totalExcludingTaxInMicros: 0,
      taxAmountInMicros: null,
      taxCalculationStatus: "disabled",
      taxBreakdown: null,
    };
  });

  const totalRowLabel = $derived(
    startData.change_type === "deferred" && startData.estimated_renewal_price
      ? "Estimated at next renewal"
      : null,
  );

  const pendingTaxLabel = $derived(
    startData.price_breakdown || startData.estimated_renewal_price
      ? "Calculated later"
      : null,
  );

  const showRefundBlock = $derived(startData.change_type === "immediate");
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <div class="rcb-upgrade-title">
      <Typography size="heading-2xl" branded>{pageTitle}</Typography>
    </div>

    <div class="rcb-upgrade-panels">
      <PlanCard name={fromTitle} price={fromPrice} variant="current" />
      <PlanCard name={toTitle} price={toPrice} variant="new" />
    </div>
  </div>

  <div class="rcb-upgrade-pricing-table">
    <PricingTable
      {priceBreakdown}
      trialPhase={null}
      basePhase={null}
      resolvedDiscount={null}
      showDiscountCodeField={false}
      discountCode=""
      appliedDiscountCode={null}
      discountCodeError={null}
      isUpdatingDiscountCode={false}
      isDiscountCodeControlsEnabled={false}
      onDiscountCodeChange={undefined}
      onApplyDiscountCode={undefined}
      onRemoveDiscountCode={undefined}
      {pendingTaxLabel}
      {totalRowLabel}
    />
  </div>

  {#if showRefundBlock}
    <div class="rcb-upgrade-refund">
      <RefundForUnusedTime previousProductName={fromTitle} />
    </div>
  {/if}
</div>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    user-select: none;
  }

  .rcb-upgrade-pricing-table {
    margin-top: 48px;
  }

  .rcb-upgrade-refund {
    margin-top: 32px;
  }

  .rcb-pricing-info-header {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .rcb-upgrade-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-upgrade-panels {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-upgrade-panels {
      gap: var(--rc-spacing-gapSmall-desktop);
    }
  }
</style>
