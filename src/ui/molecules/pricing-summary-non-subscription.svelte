<script lang="ts">
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { type PriceBreakdown } from "../ui-types";
  import {
    type PricingPhase,
    type DiscountPricePhase,
  } from "../../entities/offerings";
  import Typography from "../atoms/typography.svelte";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    discountPricePhase: DiscountPricePhase | null;
  };

  let { priceBreakdown, basePhase, discountPricePhase }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    $translator.formatPrice(
      basePhase?.price?.amountMicros ?? 0,
      priceBreakdown.currency,
    ),
  );

  const formattedPromoPrice = $derived(
    discountPricePhase?.price
      ? $translator.formatPrice(
          discountPricePhase.price.amountMicros,
          discountPricePhase.price.currency,
        )
      : "",
  );

  const baseTypographySize = "heading-lg";
</script>

<div>
  <Typography size={baseTypographySize} strikethrough={!!formattedPromoPrice}>
    {formattedPrice}
  </Typography>
  {#if formattedPromoPrice}
    <Typography size={baseTypographySize}>
      {formattedPromoPrice}
    </Typography>
  {/if}
</div>
