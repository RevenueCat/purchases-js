<script lang="ts">
  import Localized from "../../../localization/localized.svelte";
  import { LocalizationKeys } from "../../../localization/supportedLanguages";
  import { type NonSubscriptionOption } from "../../../../entities/offerings";
  import type { Translator } from "../../../localization/translator";
  import { translatorContextKey } from "../../../localization/constants";
  import { type Writable } from "svelte/store";
  import { getContext } from "svelte";

  export let purchaseOption: NonSubscriptionOption;

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

<style>
  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleMedium-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-product-price {
      font: var(--rc-text-titleMedium-desktop);
    }
  }
</style>
