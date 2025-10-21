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
  import { englishLocale } from "../localization/constants";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    trialPhase: PricingPhase | null;
    introPricePhase: PricingPhase | null;
  };

  let { priceBreakdown, basePhase, trialPhase, introPricePhase }: Props =
    $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const introPriceDuration = $derived(
    ({ hideSingularNumber }: { hideSingularNumber: boolean }) => {
      const phase = introPricePhase;
      if (!phase?.period) return "";

      const { number, unit } = phase.period;
      const totalPeriods = number * phase.cycleCount;

      // Specifically for English locale, instead of showing "First 1 week for..." we show "First week for..."
      // This is a customer paper cut that we want to fix, but we run into limitations of the templating translation system.
      // In order to avoid impact to other locales, we only apply this to the English locale.
      if (
        totalPeriods === 1 &&
        hideSingularNumber &&
        $translator.selectedLocale === englishLocale
      ) {
        return $translator.translatePeriodUnit(unit) || "";
      }

      return $translator.translatePeriod(totalPeriods, unit) || "";
    },
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
  const isIntroPricePaidUpfront = $derived(introPricePhase?.cycleCount == 1);

  const formattedPrice = $derived(
    $translator.formatPrice(
      hasIntroPrice
        ? (basePhase?.price?.amountMicros ?? 0)
        : priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );

  const formattedIntroPrice = $derived(
    $translator.formatPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );
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
        {#if hasTrial}
          <Localized
            key={LocalizationKeys.ProductInfoIntroPricePhaseAfterTrial}
            variables={{
              introPriceDuration: introPriceDuration({
                hideSingularNumber: false,
              }),
              introPrice: formattedIntroPrice,
            }}
          />
        {:else}
          <Localized
            key={LocalizationKeys.ProductInfoIntroPricePhase}
            variables={{
              introPriceDuration: introPriceDuration({
                hideSingularNumber: true,
              }),
              introPrice: formattedIntroPrice,
            }}
          />
        {/if}
      </Typography>

      {#if isIntroPricePaidUpfront}
        <Typography size="body-small">
          <Localized
            key={LocalizationKeys.ProductInfoIntroPricePhasePaidOnce}
          />
        </Typography>
      {:else if introPricePhase.period}
        <Typography size="body-small">
          {$translator.translatePeriodFrequency(
            introPricePhase.period.number,
            introPricePhase.period.unit,
            { useMultipleWords: true },
          )}
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
