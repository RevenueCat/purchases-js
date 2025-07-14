<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";
  import { type PriceBreakdown } from "../ui-types";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;
  export let priceBreakdown: PriceBreakdown;

  const subscriptionOption = purchaseOption as SubscriptionOption;

  const basePhase = subscriptionOption?.base;
  const trialPhase = subscriptionOption?.trial;
  const introPricePhase = subscriptionOption?.introPrice;
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
  <PricingTable {basePhase} {priceBreakdown} {trialPhase} {introPricePhase} />
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
