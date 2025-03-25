<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    ProductType,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductInfoHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";
  import { type PriceBreakdown } from "../ui-types";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;
  export let priceBreakdown: PriceBreakdown;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;

  const subscriptionOption = purchaseOption as SubscriptionOption;

  const basePhase = subscriptionOption?.base;
  const trialPhase = subscriptionOption?.trial;
</script>

<section>
  <div class="rcb-pricing-info" class:has-expanded-details={isSubscription}>
    <ProductInfoHeader {productDetails} {showProductDescription} />
    <PricingSummary {priceBreakdown} {basePhase} {trialPhase} />
    <PricingTable {priceBreakdown} {trialPhase} />
  </div>
</section>

<style>
  .rcb-pricing-info {
    display: flex;
    flex-direction: column;
    font: var(--rc-text-body1-mobile);
    gap: var(--rc-spacing-gapLarge-mobile);
    user-select: none;
  }

  .rcb-pricing-info {
    gap: var(--rc-spacing-gapXXLarge-mobile);
  }

  @container layout-query-container (width < 768px) {
    .rcb-pricing-info {
      margin-top: var(--rc-spacing-gapXLarge-mobile);
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-info {
      margin-top: calc(var(--rc-spacing-gapXXLarge-desktop) * 2);
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }

    .rcb-pricing-info.has-expanded-details {
      gap: var(--rc-spacing-gapXXXLarge-desktop);
    }
  }
</style>
