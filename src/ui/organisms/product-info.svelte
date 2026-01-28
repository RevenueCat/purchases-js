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
  import PricingSummaryNonSubscription from "../molecules/pricing-summary-non-subscription.svelte";
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

  // For subscriptions: use base phase directly
  // For non-subscriptions: create a PricingPhase from basePrice
  const basePhase: PricingPhase | null = isSubscription
    ? (subscriptionOption?.base ?? null)
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

  const trialPhase = subscriptionOption?.trial ?? null;
  const discountPricePhase =
    subscriptionOption?.discountPrice ??
    nonSubscriptionOption?.discountPrice ??
    null;
  const introPricePhase = subscriptionOption?.introPrice ?? null;
  const promotionalPricePhase: PricingPhase | DiscountPricePhase | null =
    subscriptionOption?.discountPrice ??
    subscriptionOption?.introPrice ??
    nonSubscriptionOption?.discountPrice ??
    null;
</script>

<div class="rcb-pricing-info">
  <div class="rcb-pricing-info-header">
    <ProductHeader {productDetails} {showProductDescription} />
    {#if isSubscription}
      <PricingSummary
        {priceBreakdown}
        {basePhase}
        {trialPhase}
        {discountPricePhase}
        {introPricePhase}
      />
    {:else}
      <PricingSummaryNonSubscription
        {priceBreakdown}
        {basePhase}
        {discountPricePhase}
      />
    {/if}
  </div>
  <PricingTable
    {priceBreakdown}
    {trialPhase}
    {basePhase}
    {promotionalPricePhase}
    hasDiscount={!!discountPricePhase}
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
