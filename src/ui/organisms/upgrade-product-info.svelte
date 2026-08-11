<script lang="ts">
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import type {
    SubscriptionChangeCheckoutStartResponse,
    SubscriptionChangePriceBreakdownSummary,
  } from "../../networking/responses/subscription-change-response";
  import type { PriceBreakdown } from "../ui-types";
  import type { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import PricingTable from "../molecules/pricing-table.svelte";
  import SubscriptionChangeProducts from "../molecules/subscription-change-products.svelte";
  import Typography from "../atoms/typography.svelte";

  interface Props {
    startData: SubscriptionChangeCheckoutStartResponse;
  }

  let { startData }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const fromTitle = $derived(
    startData.from_product.display_name ?? startData.from_product.product_id,
  );
  const toTitle = $derived(
    startData.to_product.display_name ?? startData.to_product.product_id,
  );
  const fromPrice = $derived(
    $translator.formatPrice(
      startData.from_product.price_in_micros,
      startData.from_product.currency,
    ),
  );
  const toPrice = $derived(
    $translator.formatPrice(
      startData.to_product.price_in_micros,
      startData.to_product.currency,
    ),
  );

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

  const headerTitle = $derived(
    startData.change_type === "deferred"
      ? "Change your subscription"
      : "Upgrade your subscription",
  );
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <Typography size="heading-xl" branded>
      {headerTitle}
    </Typography>
    <SubscriptionChangeProducts {fromTitle} {fromPrice} {toTitle} {toPrice} />
  </div>

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

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    user-select: none;
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-pricing-info-header {
    display: flex;
    flex-direction: column;
    /* 24px — no exact spacing token (gapXLarge is 16/32) */
    gap: 1.5rem;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }
  }
</style>
