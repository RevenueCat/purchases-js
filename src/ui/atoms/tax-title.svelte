<script lang="ts">
  import { type Writable } from "svelte/store";
  import { type Translator } from "../localization/translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "../localization/constants";
  import { LocalizationKeys } from "../localization/supportedLanguages";

  export let taxType: string | null;
  export let country: string | null;
  export let state: string | null;
  export let taxPercentageInMicros: number | null;

  const translator: Writable<Translator> = getContext(translatorContextKey);

  let title = "";

  if (!taxType) {
    title = $translator.translate(LocalizationKeys.PricingTableTax);
  } else if (!taxType.includes("_")) {
    title = taxType.toUpperCase();
  } else {
    title = taxType
      .split("_")
      .map(
        (chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase(),
      )
      .join(" ");
  }

  if (state) {
    title += ` - ${state}`;
  } else if (country) {
    const countryName = $translator.formatCountry(country);
    title += ` - ${countryName}`;
  }

  if (taxPercentageInMicros) {
    title += ` (${taxPercentageInMicros / 10000}%)`;
  }
</script>

{title}
