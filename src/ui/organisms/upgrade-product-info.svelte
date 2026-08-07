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
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <div class="rcb-upgrade-product">
      <div class="rcb-upgrade-label">
        <Typography size="body-base">Upgrade from</Typography>
      </div>
      <div class="rcb-product-title">
        <Typography size="heading-lg" branded>
          {fromTitle} — {fromPrice}
        </Typography>
      </div>
    </div>

    <div class="rcb-upgrade-product">
      <div class="rcb-upgrade-label">
        <Typography size="body-base">Upgrade to</Typography>
      </div>
      <div class="rcb-product-title">
        <Typography size="heading-lg" branded>
          {toTitle} — {toPrice}
        </Typography>
      </div>
    </div>
  </div>

  <PricingTable
    {priceBreakdown}
    trialPhase={null}
    basePhase={null}
    introPricePhase={null}
    discountPhase={null}
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
    gap: var(--rc-spacing-gapLarge-mobile);
  }

  .rcb-upgrade-product {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-upgrade-label {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-pricing-info-header {
      gap: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-upgrade-product {
      gap: var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
