<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    ProductType,
  } from "../../entities/offerings";
  import ProductInfoHeader from "../molecules/product-header.svelte";
  import ProductInfoPricing from "../molecules/product-pricing.svelte";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

<section>
  <div class="rcb-pricing-info" class:has-expanded-details={isSubscription}>
    <ProductInfoHeader {productDetails} {showProductDescription} />
    <ProductInfoPricing {productDetails} {purchaseOption} />
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
