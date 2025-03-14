<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    type NonSubscriptionOption,
    type SubscriptionOption,
    ProductType,
  } from "../../../entities/offerings";
  import NonSubscriptionPricing from "./pricing/non-subscription-pricing.svelte";
  import SubscriptionPricing from "./pricing/subscription-pricing.svelte";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

{#if isSubscription}
  <SubscriptionPricing purchaseOption={purchaseOption as SubscriptionOption} />
{:else}
  <NonSubscriptionPricing
    purchaseOption={purchaseOption as NonSubscriptionOption}
  />
{/if}
