<script lang="ts">
  import { type Writable } from "svelte/store";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import {
    translatorContextKey,
    englishLocale,
  } from "../localization/constants";
  import { getTranslatedPeriodLength } from "../../helpers/price-labels";
  import { type PriceBreakdown } from "../ui-types";
  import {
    type PricingPhase,
    type DiscountPhase,
  } from "../../entities/offerings";
  import Typography from "../atoms/typography.svelte";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    trialPhase: PricingPhase | null;
    discountPhase: DiscountPhase | null;
    introPricePhase: PricingPhase | null;
  };

  let {
    priceBreakdown,
    basePhase,
    trialPhase,
    discountPhase,
    introPricePhase,
  }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);
  const hasTrial = $derived(!!trialPhase?.periodDuration);
  const isPromoPaidUpfront = $derived(introPricePhase?.cycleCount === 1);
  const promotionalPricePhase = $derived(discountPhase || introPricePhase);
  const hasForeverPromotion = $derived(
    !!(discountPhase && discountPhase.durationMode === "forever"),
  );
  const hasLimitedTimePromotion = $derived(
    !!(introPricePhase || (discountPhase && !hasForeverPromotion)),
  );

  const promoPriceDurationText = $derived.by(() => {
    if (!hasLimitedTimePromotion || !promotionalPricePhase?.period) return "";

    const totalPeriods =
      promotionalPricePhase.period.number * promotionalPricePhase?.cycleCount;
    const unit = promotionalPricePhase.period.unit;

    if (totalPeriods == null || unit == null) return "";

    // Specifically for English locale, instead of showing "First 1 week for..." we show "First week for..."
    // This is a customer paper cut that we want to fix, but we run into limitations of the templating translation system.
    // In order to avoid impact to other locales, we only apply this to the English locale.
    if (
      totalPeriods === 1 &&
      !hasTrial &&
      $translator.selectedLocale === englishLocale
    ) {
      return $translator.translatePeriodUnit(unit) || "";
    }

    return $translator.translatePeriod(totalPeriods, unit) || "";
  });

  const promoFrequencyText = $derived.by(() => {
    if (!promotionalPricePhase?.period) return "";

    if (isPromoPaidUpfront) {
      return $translator.translate(
        LocalizationKeys.ProductInfoIntroPricePhasePaidOnce,
      );
    }

    if (
      discountPhase &&
      discountPhase.period &&
      discountPhase?.durationMode === "time_window"
    ) {
      return (
        $translator.translatePeriodFrequency(1, discountPhase.period.unit, {
          useMultipleWords: true,
        }) || ""
      );
    }

    if (introPricePhase && introPricePhase?.period) {
      return (
        $translator.translatePeriodFrequency(
          introPricePhase.period.number,
          introPricePhase.period.unit,
          { useMultipleWords: true },
        ) || ""
      );
    }
    return "";
  });

  const promoHeadingKey = $derived(
    hasTrial
      ? LocalizationKeys.ProductInfoIntroPricePhaseAfterTrial
      : LocalizationKeys.ProductInfoIntroPricePhase,
  );

  const formattedPromoPrice = $derived(
    $translator.formatPrice(
      priceBreakdown.totalAmountInMicros,
      priceBreakdown.currency,
    ),
  );

  const formattedPrice = $derived.by(() => {
    const useBasePhasePrice = introPricePhase || discountPhase;

    const micros = useBasePhasePrice
      ? (basePhase?.price?.amountMicros ?? 0)
      : priceBreakdown.totalAmountInMicros;

    return $translator.formatPrice(micros, priceBreakdown.currency);
  });

  const afterKey = $derived.by(() => {
    if (hasLimitedTimePromotion) return LocalizationKeys.ProductInfoAfter;
    if (hasTrial) return LocalizationKeys.ProductInfoAfterTrial;
    return null;
  });

  const trialTypographySize = "heading-lg";
  const promoTypographySize = $derived(hasTrial ? "heading-md" : "heading-lg");
  const baseTypographySize = $derived(
    hasTrial || hasLimitedTimePromotion ? "heading-md" : "heading-lg",
  );
</script>

<div class="rcb-product-price-container">
  {#if hasTrial}
    <div>
      <Typography size={trialTypographySize}>
        <Localized
          key={LocalizationKeys.ProductInfoFreeTrialDuration}
          variables={{
            trialDuration: getTranslatedPeriodLength(
              trialPhase!.periodDuration!,
              $translator,
            ),
          }}
        />
      </Typography>
    </div>
  {/if}

  {#if hasLimitedTimePromotion}
    <div>
      <Typography size={promoTypographySize}>
        <Localized
          key={promoHeadingKey}
          variables={{
            introPriceDuration: promoPriceDurationText,
            introPrice: formattedPromoPrice,
          }}
        />
      </Typography>

      {#if promoFrequencyText}
        <Typography size="body-small">{promoFrequencyText}</Typography>
      {/if}
    </div>
  {/if}

  <div>
    <Typography size={baseTypographySize} strikethrough={hasForeverPromotion}>
      {formattedPrice}
    </Typography>
    {#if hasForeverPromotion}
      <Typography size={baseTypographySize}>
        {formattedPromoPrice}
      </Typography>
    {/if}

    {#if basePhase?.period}
      <Typography size="body-small">
        {$translator.translatePeriodFrequency(
          basePhase.period.number,
          basePhase.period.unit,
          { useMultipleWords: true },
        )}
      </Typography>
    {/if}

    {#if afterKey}
      <Typography size="body-small">
        <Localized key={afterKey} />
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
