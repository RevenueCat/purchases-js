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
    introPricePhase: PricingPhase | null;
  };

  let { priceBreakdown, basePhase, trialPhase, introPricePhase }: Props =
    $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    $translator.formatPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );

  const formattedIntroPrice = $derived(
    $translator.formatPrice(
      introPricePhase?.price?.amountMicros ?? 0,
      priceBreakdown.currency,
    ),
  );

  // Determine typography sizes - first visible element gets heading-lg, rest get heading-md
  const trialTypographySize = $derived("heading-lg");
  const introTypographySize = $derived(
    trialPhase?.periodDuration ? "heading-md" : "heading-lg",
  );
  const baseTypographySize = $derived(
    trialPhase?.periodDuration || introPricePhase?.periodDuration
      ? "heading-md"
      : "heading-lg",
  );

  // Determine conditional text to show after intro price and base price
  const hasTrial = $derived(trialPhase?.periodDuration);
  const hasIntroPrice = $derived(introPricePhase?.periodDuration);
</script>

<div class="rcb-product-price-container">
  {#if trialPhase?.periodDuration}
    <div>
      <Typography size={trialTypographySize}>
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

  {#if introPricePhase?.periodDuration}
    <div>
      <Typography size={introTypographySize}>
        <Localized
          key={introPricePhase.cycleCount === 1
            ? LocalizationKeys.ProductInfoIntroPricePhasePaidUpfront
            : LocalizationKeys.ProductInfoIntroPricePhaseRecurring}
          variables={{
            introPriceDuration: getTranslatedPeriodLength(
              introPricePhase.periodDuration,
              $translator,
            ),
            introPrice: formattedIntroPrice,
          }}
        />
      </Typography>

      {#if introPricePhase.cycleCount > 1 && introPricePhase.period}
        <Typography size="body-small">
          {$translator.translatePeriodFrequency(
            introPricePhase.period.number,
            introPricePhase.period.unit,
            { useMultipleWords: true },
          )}
        </Typography>
      {/if}

      {#if hasTrial}
        <Typography size="body-small">
          <Localized key={LocalizationKeys.ProductInfoAfterTrial} />
        </Typography>
      {/if}
    </div>
  {/if}

  <div>
    <Typography size={baseTypographySize}>
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

    {#if hasIntroPrice}
      <Typography size="body-small">
        <Localized key={LocalizationKeys.ProductInfoAfter} />
      </Typography>
    {:else if hasTrial}
      <Typography size="body-small">
        <Localized key={LocalizationKeys.ProductInfoAfterTrial} />
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
