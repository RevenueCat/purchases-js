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
  import Typography from "../atoms/typography.svelte";

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
    <div>
      <Typography size="heading-lg">
        <Localized
          key={LocalizationKeys.ProductInfoFreeTrialDuration}
          variables={{
            trialDuration: getTranslatedPeriodLength(
              trialPhase.periodDuration,
              $translator,
            ),
          }}
        />
      </Typography>
    </div>
  {/if}

  <div>
    <Typography size="heading-lg">
      {formattedPrice}
    </Typography>

    {#if basePhase?.period}
      <Typography size="body-small">
        {$translator.translatePeriodFrequency(
          basePhase.period.number,
          basePhase.period.unit,
          { useMultipleWords: true },
        )}
      </Typography>
    {/if}
  </div>
</div>

<style>
  .rcb-product-price-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--rc-spacing-gapMedium-mobile);
    color: var(--rc-color-grey-text-dark);
  }
</style>
