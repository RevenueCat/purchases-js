<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    ProductType,
    type SubscriptionOption,
  } from "../../entities/offerings";
  import PricingDropdown from "../molecules/pricing-dropdown.svelte";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductInfoHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";
  import { getNextRenewalDate } from "../../helpers/duration-helper";
  import { type PriceBreakdown } from "../ui-types";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;
  export let priceBreakdown: PriceBreakdown;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;

  const subscriptionOption = purchaseOption as SubscriptionOption;

  let trialEndDate = null;
  const expectedPeriod = subscriptionOption?.trial?.period;
  if (expectedPeriod) {
    trialEndDate = getNextRenewalDate(new Date(), expectedPeriod, true);
  }
</script>

<section>
  <div class="rcb-pricing-info" class:has-expanded-details={isSubscription}>
    <ProductInfoHeader {productDetails} {showProductDescription} />
    <PricingSummary {productDetails} {purchaseOption} />
    <PricingDropdown>
      <PricingTable {priceBreakdown} {trialEndDate} />
    </PricingDropdown>
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
