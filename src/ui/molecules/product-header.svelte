<script lang="ts">
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { ProductType, type Product } from "../../entities/offerings";
  import Typography from "../atoms/typography.svelte";

  export let productDetails: Product;
  export let showProductDescription: boolean;

  const isSubscription =
    productDetails.productType === ProductType.Subscription;
</script>

<div class="rcb-pricing-info-header">
  {#if isSubscription}
    <div class="rcb-subscribe-to">
      <Typography size="body-base">
        <Localized
          key={LocalizationKeys.ProductInfoSubscribeTo}
          variables={{ productTitle: productDetails.title }}
        />
      </Typography>
    </div>
  {/if}
  <div class="rcb-product-title">
    <Typography size="heading-lg" branded>
      <Localized
        key={LocalizationKeys.ProductInfoProductTitle}
        variables={{ productTitle: productDetails.title }}
      />
    </Typography>
  </div>
  {#if showProductDescription && productDetails.description}
    <span class="rcb-product-description">
      <Typography size="body-small">
        <Localized
          key={LocalizationKeys.ProductInfoProductDescription}
          variables={{
            productDescription: productDetails.description,
          }}
        />
      </Typography>
    </span>
  {/if}
</div>

<style>
  .rcb-pricing-info-header {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-product-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-product-description {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-subscribe-to {
    display: none;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-subscribe-to {
      display: block;
    }

    .rcb-pricing-info-header {
      display: flex;
      flex-direction: column;
      gap: var(--rc-spacing-gapMedium-desktop);
    }
  }
</style>
