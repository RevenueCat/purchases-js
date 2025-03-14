<script lang="ts">
  import Localized from "../../../localization/localized.svelte";
  import { LocalizationKeys } from "../../../localization/supportedLanguages";
  import {
    type NonSubscriptionOption,
    type Product,
  } from "../../../../entities/offerings";
  import type { Translator } from "../../../localization/translator";
  import { translatorContextKey } from "../../../localization/constants";
  import { type Writable } from "svelte/store";
  import { getContext } from "svelte";

  export let productDetails: Product;
  export let purchaseOption: NonSubscriptionOption;
  export let showProductDescription: boolean = false;

  const basePrice = purchaseOption?.basePrice;
  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedNonSubscriptionBasePrice =
    basePrice &&
    $translator.formatPrice(basePrice.amountMicros, basePrice.currency);
</script>

<span class="rcb-product-price">
  <Localized
    key={LocalizationKeys.ProductInfoProductPrice}
    variables={{ productPrice: formattedNonSubscriptionBasePrice }}
  />
</span>

{#if showProductDescription}
  <span class="rcb-product-description">
    <Localized
      key={LocalizationKeys.ProductInfoProductDescription}
      variables={{ productDescription: productDetails.description }}
    />
  </span>
{/if}

<style>
  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleMedium-mobile);
  }

  .rcb-product-description {
    font: var(--rc-text-body1-mobile);
    color: var(--rc-color-grey-text-dark);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-product-price {
      font: var(--rc-text-titleMedium-desktop);
    }

    .rcb-product-description {
      font: var(--rc-text-body1-desktop);
    }
  }
</style>
