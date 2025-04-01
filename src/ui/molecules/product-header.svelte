<script lang="ts">
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { ProductType, type Product } from "../../entities/offerings";

  export let productDetails: Product;
  export let showProductDescription: boolean;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

<div class="rcb-pricing-info-header">
  {#if isSubscription}
    <div class="rcb-subscribe-to only-desktop">
      <Localized
        key={LocalizationKeys.ProductInfoSubscribeTo}
        variables={{ productTitle: productDetails.title }}
      />
    </div>
  {/if}
  <div class="rcb-product-title">
    <Localized
      key={LocalizationKeys.ProductInfoProductTitle}
      variables={{ productTitle: productDetails.title }}
    />
  </div>
  {#if showProductDescription && productDetails.description}
    <span class="rcb-product-description">
      <Localized
        key={LocalizationKeys.ProductInfoProductDescription}
        variables={{
          productDescription: productDetails.description,
        }}
      />
    </span>
  {/if}
</div>

<style>
  .rcb-pricing-info-header {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-desktop);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleXLarge-mobile);
  }

  .rcb-product-description {
    font: var(--rc-text-body1-mobile);
    color: var(--rc-color-grey-text-light);
  }

  .rcb-subscribe-to {
    font: var(--rc-text-body1-desktop);
  }

  .only-desktop {
    display: none;
  }

  @container layout-query-container (width >= 768px) {
    .only-desktop {
      display: block;
    }

    .rcb-pricing-info-header {
      display: flex;
      flex-direction: column;
      gap: var(--rc-spacing-gapXLarge-desktop);
    }

    .rcb-product-title {
      font: var(--rc-text-titleXLarge-desktop);
    }

    .rcb-product-description {
      font: var(--rc-text-body1-desktop);
    }
  }
</style>
