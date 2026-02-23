<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
    type NonSubscriptionOption,
    type PricingPhase,
    type DiscountPricePhase,
  } from "../../entities/offerings";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";
  import { type PriceBreakdown } from "../ui-types";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;
  export let priceBreakdown: PriceBreakdown;

  const isSubscription = productDetails.productType === "subscription";
  const subscriptionOption = isSubscription
    ? (purchaseOption as SubscriptionOption)
    : null;
  const nonSubscriptionOption = !isSubscription
    ? (purchaseOption as NonSubscriptionOption)
    : null;

  const basePhase = subscriptionOption?.base ?? null;
  const trialPhase = subscriptionOption?.trial ?? null;
  const introPricePhase = subscriptionOption?.introPrice ?? null;

  const basePhaseForTable: PricingPhase | null = subscriptionOption?.base
    ? subscriptionOption.base
    : nonSubscriptionOption?.basePrice
      ? {
          periodDuration: null,
          period: null,
          cycleCount: 1,
          price: nonSubscriptionOption.basePrice,
          pricePerWeek: null,
          pricePerMonth: null,
          pricePerYear: null,
        }
      : null;

  const promotionalPricePhaseForTable:
    | PricingPhase
    | DiscountPricePhase
    | null =
    subscriptionOption?.discountPrice ??
    nonSubscriptionOption?.discountPrice ??
    null;
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <ProductHeader {productDetails} {showProductDescription} />
    <PricingSummary
      {priceBreakdown}
      {basePhase}
      {trialPhase}
      {introPricePhase}
    />
  </div>
  <PricingTable
    {priceBreakdown}
    {trialPhase}
    basePhase={basePhaseForTable}
    promotionalPricePhase={promotionalPricePhaseForTable}
    hasDiscount={!!promotionalPricePhaseForTable}
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

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-pricing-info-header {
      gap: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
