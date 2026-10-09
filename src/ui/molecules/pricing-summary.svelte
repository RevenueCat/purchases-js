<script lang="ts">
  import { type Writable } from "svelte/store";
  import Localized from "../localization/localized.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import {
    getPeriodDurationLabel,
    getTranslatedPeriodLength,
  } from "../../helpers/price-labels";
  import { getOfferDuration } from "../../helpers/paywall-offer-helpers";
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
  const hasLimitedTimePromotion = $derived(!!introPricePhase);
  const hasAppliedDiscount = $derived(
    !!discountPhase || (priceBreakdown.appliedDiscounts?.length ?? 0) > 0,
  );

  const promoPriceDurationText = $derived(
    hasLimitedTimePromotion
      ? getPeriodDurationLabel(
          getOfferDuration(introPricePhase!),
          $translator,
          {
            // "First week for $1.49", not "First 1 week for $1.49". Skipped when
            // there is a trial, where the copy is "Then 1 week for $1.49".
            collapseSingularInEnglish: !hasTrial,
          },
        )
      : "",
  );

  const promoFrequencyText = $derived.by(() => {
    if (!introPricePhase?.period) return "";

    if (isPromoPaidUpfront) {
      return $translator.translate(
        LocalizationKeys.ProductInfoIntroPricePhasePaidOnce,
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
    const micros =
      introPricePhase || hasAppliedDiscount
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
