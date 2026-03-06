<script lang="ts">
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { type PriceBreakdown } from "../ui-types";
  import { type PricingPhase } from "../../entities/offerings";
  import Typography from "../atoms/typography.svelte";

  export type Props = {
    priceBreakdown: PriceBreakdown;
    basePhase: PricingPhase | null;
  };

  let { priceBreakdown, basePhase }: Props = $props();

  const translator: Writable<Translator> = getContext(translatorContextKey);

  const formattedPrice = $derived(
    $translator.formatPrice(
      basePhase?.price?.amountMicros ?? 0,
      priceBreakdown.currency,
    ),
  );

  const baseTypographySize = "heading-lg";
</script>

<div>
  <Typography size={baseTypographySize}>
    {formattedPrice}
  </Typography>
</div>
