<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    type NonSubscriptionOption,
    type SubscriptionOption,
    ProductType,
  } from "../../entities/offerings";
  import NonSubscriptionPricingWithTaxSupport from "../molecules/product-pricing-with-tax-support/non-subscription-pricing.svelte";
  import SubscriptionPricingWithTaxSupport from "../molecules/product-pricing-with-tax-support/subscription-pricing.svelte";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

{#if isSubscription}
  <SubscriptionPricingWithTaxSupport
    purchaseOption={purchaseOption as SubscriptionOption}
  />
{:else}
  <NonSubscriptionPricingWithTaxSupport
    purchaseOption={purchaseOption as NonSubscriptionOption}
  />
{/if}
