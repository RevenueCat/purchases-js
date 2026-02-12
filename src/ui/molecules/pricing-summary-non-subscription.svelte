<script lang="ts">
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { type PriceBreakdown } from "../ui-types";
  import {
    type PricingPhase,
    type DiscountPhase,
  } from "../../entities/offerings";
  import Typography from "../atoms/typography.svelte";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
    discountPhase: DiscountPhase | null;
  };

  let { priceBreakdown, basePhase, discountPhase }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    $translator.formatPrice(
      basePhase?.price?.amountMicros ?? 0,
      priceBreakdown.currency,
    ),
  );

  const formattedPromoPrice = $derived(
    discountPhase?.price
      ? $translator.formatPrice(
          discountPhase.price.amountMicros,
          discountPhase.price.currency,
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
