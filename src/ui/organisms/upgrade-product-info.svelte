<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type {
    SubscriptionChangeCheckoutStartResponse,
    SubscriptionChangePriceBreakdownSummary,
    SubscriptionChangeProductSummary,
  } from "../../networking/responses/subscription-change-response";
  import type { PriceBreakdown } from "../ui-types";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { parseISODuration } from "../../helpers/duration-helper";
  import { formatPriceWithPeriod } from "../../helpers/price-labels";
  import PricingTable from "../molecules/pricing-table.svelte";
  import PlanCard from "../molecules/plan-card.svelte";
  import UnusedTimeAdjustment from "../molecules/unused-time-adjustment.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
    unusedTimeAdjustmentVariant?: "refund" | "credit";
    unresolvedTaxCalculationStatus?: "pending" | "disabled";
  }

  let {
    startData,
    unusedTimeAdjustmentVariant = "refund",
    unresolvedTaxCalculationStatus = "pending",
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const fromTitle = $derived(
    startData.from_product.display_name ?? startData.from_product.product_id,
  );
  const toTitle = $derived(
    startData.to_product.display_name ?? startData.to_product.product_id,
  );

  const pageTitle = $derived(
    startData.change_type === "deferred"
      ? $translator.translate(
          LocalizationKeys.UpgradeProductInfoChangeSubscriptionTitle,
        )
      : $translator.translate(
          LocalizationKeys.UpgradeProductInfoUpgradeSubscriptionTitle,
        ),
  );

  function formatProductPrice(
    product: SubscriptionChangeProductSummary,
  ): string {
    const period = product.period_duration
      ? parseISODuration(product.period_duration)
      : null;
    return formatPriceWithPeriod(
      $translator.formatPrice(product.price_in_micros, product.currency),
      period,
      $translator,
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
      taxCalculationStatus:
        taxAmount != null ? "calculated" : unresolvedTaxCalculationStatus,
      taxBreakdown:
        taxAmount != null
          ? [
              {
                display_name: $translator.translate(
                  LocalizationKeys.UpgradeProductInfoTaxEstimated,
                ),
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
      ? $translator.translate(
          LocalizationKeys.UpgradeProductInfoEstimatedAtNextRenewal,
        )
      : null,
  );

  const pendingTaxLabel = $derived(
    startData.price_breakdown || startData.estimated_renewal_price
      ? $translator.translate(
          LocalizationKeys.UpgradeProductInfoCalculatedLater,
        )
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
      <UnusedTimeAdjustment
        previousProductName={fromTitle}
        variant={unusedTimeAdjustmentVariant}
      />
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
