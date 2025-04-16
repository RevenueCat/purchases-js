<script lang="ts">
  import InfoMessage from "./info-message.svelte";
  import { Translator } from "../localization/translator";
  import { translatorContextKey } from "../localization/constants";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { LocalizationKeys } from "../localization/supportedLanguages";

  const translator: Writable<Translator> = getContext(translatorContextKey);
</script>

<InfoMessage
  title={$translator.translate(LocalizationKeys.PriceUpdateTitle)}
  message={$translator.translate(LocalizationKeys.PriceUpdateMessage)}
/>
