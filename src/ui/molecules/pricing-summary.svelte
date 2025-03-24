<script lang="ts">
  import { type Writable } from "svelte/store";
  import {
    type Product,
    type PurchaseOption,
    type NonSubscriptionOption,
    type SubscriptionOption,
    ProductType,
    type Price,
  } from "../../entities/offerings";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { getTranslatedPeriodLength } from "../../helpers/price-labels";

  export type Props = {
    productDetails: Product;
    purchaseOption: PurchaseOption;
    priceToPay?: Price;
  };

  let { productDetails, purchaseOption, priceToPay }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const isSubscription = $derived(
    productDetails.productType === ProductType.Subscription,
  );

  const subscriptionPurchaseOption = $derived(
    isSubscription ? (purchaseOption as SubscriptionOption) : null,
  );

  const nonSubscriptionPurchaseOption = $derived(
    !isSubscription ? (purchaseOption as NonSubscriptionOption) : null,
  );

  const basePrice = $derived(
    isSubscription
      ? subscriptionPurchaseOption?.base?.price
      : nonSubscriptionPurchaseOption?.basePrice,
  );

  const price = $derived(priceToPay || basePrice);

  const formattedPrice = $derived(
    price && $translator.formatPrice(price.amountMicros, price.currency),
  );
</script>

<div class="rcb-product-price-container">
  {#if isSubscription && subscriptionPurchaseOption?.trial?.periodDuration}
    <div class="rcb-product-trial">
      <Localized
        key={LocalizationKeys.ProductInfoFreeTrialDuration}
        variables={{
          trialDuration: getTranslatedPeriodLength(
            subscriptionPurchaseOption.trial.periodDuration || "",
            $translator,
          ),
        }}
      />
    </div>
  {/if}

  <div>
    <span class="rcb-product-price">
      <Localized
        key={LocalizationKeys.ProductInfoProductPrice}
        variables={{
          productPrice: formattedPrice,
        }}
      />
    </span>

    {#if isSubscription && subscriptionPurchaseOption?.base?.period}
      <span class="rcb-product-price-frequency">
        <span class="rcb-product-price-frequency-text">
          {$translator.translatePeriodFrequency(
            subscriptionPurchaseOption.base.period.number,
            subscriptionPurchaseOption.base.period.unit,
            { useMultipleWords: true },
          )}</span
        >
      </span>
    {/if}
  </div>
</div>

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

  .rcb-product-price-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-product-trial {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleLarge-mobile);
  }

  .rcb-product-price-frequency {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-body1-mobile);
  }

  .rcb-product-price-frequency-text {
    white-space: nowrap;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-product-price-frequency {
      font: var(--rc-text-body1-desktop);
    }

    .rcb-product-trial {
      font: var(--rc-text-titleLarge-desktop);
    }
  }
</style>
