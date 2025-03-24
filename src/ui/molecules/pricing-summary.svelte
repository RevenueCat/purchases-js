<script lang="ts">
  import { type Writable } from "svelte/store";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { getTranslatedPeriodLength } from "../../helpers/price-labels";
  import { type PriceBreakdown } from "../ui-types";
  import { type PricingPhase } from "../../entities/offerings";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    trialPhase: PricingPhase | null;
  };

  let { priceBreakdown, basePhase, trialPhase }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    $translator.formatPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );
</script>

<div class="rcb-product-price-container">
  {#if trialPhase?.periodDuration}
    <div class="rcb-product-trial">
      <Localized
        key={LocalizationKeys.ProductInfoFreeTrialDuration}
        variables={{
          trialDuration: getTranslatedPeriodLength(
            trialPhase.periodDuration,
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

    {#if basePhase?.period}
      <span class="rcb-product-price-frequency">
        <span class="rcb-product-price-frequency-text">
          {$translator.translatePeriodFrequency(
            basePhase.period.number,
            basePhase.period.unit,
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
