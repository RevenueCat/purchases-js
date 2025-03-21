<script lang="ts">
  import Localized from "../../localization/localized.svelte";
  import { LocalizationKeys } from "../../localization/supportedLanguages";
  import type { Translator } from "../../localization/translator";
  import { type SubscriptionOption } from "../../../entities/offerings";
  import { getTranslatedPeriodLength } from "../../../helpers/price-labels";
  import { translatorContextKey } from "../../localization/constants";
  import { type Writable } from "svelte/store";
  import { getContext } from "svelte";

  export let purchaseOption: SubscriptionOption;

  const subscriptionBasePrice = purchaseOption?.base?.price;
  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedSubscriptionBasePrice =
    subscriptionBasePrice &&
    $translator.formatPrice(
      subscriptionBasePrice.amountMicros,
      subscriptionBasePrice.currency,
    );
</script>

<div class="rcb-product-price-container">
  {#if purchaseOption?.trial?.periodDuration}
    <div class="rcb-product-trial">
      <Localized
        key={LocalizationKeys.ProductInfoFreeTrialDuration}
        variables={{
          trialDuration: getTranslatedPeriodLength(
            purchaseOption.trial.periodDuration || "",
            $translator,
          ),
        }}
      />
    </div>
  {/if}
  <div>
    {#if subscriptionBasePrice}
      <span class="rcb-product-price">
        <Localized
          key={LocalizationKeys.ProductInfoProductPrice}
          variables={{
            productPrice: formattedSubscriptionBasePrice,
          }}
        />
      </span>
    {/if}

    {#if purchaseOption?.base?.period}
      <span class="rcb-product-price-frequency">
        <span class="rcb-product-price-frequency-text">
          {$translator.translatePeriodFrequency(
            purchaseOption.base.period.number,
            purchaseOption.base.period.unit,
            { useMultipleWords: true },
          )}</span
        >
      </span>
    {/if}
  </div>
</div>

<style>
  .rcb-product-price-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-product-price {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-titleMedium-mobile);
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
    .rcb-product-price {
      font: var(--rc-text-titleMedium-desktop);
    }

    .rcb-product-price-frequency {
      font: var(--rc-text-body1-desktop);
    }

    .rcb-product-trial {
      font: var(--rc-text-titleLarge-desktop);
    }
  }
</style>
