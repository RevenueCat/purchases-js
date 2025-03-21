<script lang="ts">
  import {
    type Product,
    type PurchaseOption,
    ProductType,
  } from "../../entities/offerings";
  import PricingDropdown from "../molecules/pricing-dropdown.svelte";
  import PricingTable from "../molecules/pricing-table.svelte";
  import ProductInfoHeader from "../molecules/product-header.svelte";
  import PricingSummary from "../molecules/pricing-summary.svelte";

  export let productDetails: Product;
  export let purchaseOption: PurchaseOption;
  export let showProductDescription: boolean;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

<section>
  <div class="rcb-pricing-info" class:has-expanded-details={isSubscription}>
    <ProductInfoHeader {productDetails} {showProductDescription} />
    <PricingSummary {productDetails} {purchaseOption} />
    <PricingDropdown>
      <PricingTable
        currency="EUR"
        totalExcludingTax={28.93}
        taxItems={[
          {
            taxType: "vat",
            taxAmountInMicros: 6060000,
            taxPercentageInMicros: 210000,
            country: "ES",
            state: null,
          },
        ]}
        trialEndDate={new Date("2025-03-20")}
        renewalTotal={34.99}
        total={0}
      />
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
