<script lang="ts">
  import { Translator } from "./translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "./constants";


  export interface LocalizedProps {
    labelId: string;
    variables?: Record<string, string>;
    children?: any;
    selectedLocale?: string;
    defaultLocale: string;
  }

  const { labelId = "", selectedLocale, defaultLocale = "en", variables, children }: LocalizedProps = $props();
  // Create a new translator if the user passes a selectedLocale
  const userDefinedTranslator: Translator = new Translator({}, selectedLocale || "", defaultLocale);
  // Use the contextual translator if it exists
  const contextTranslator: Translator = getContext(translatorContextKey);
  // Use the userDefinedTranslator if the selectedLocale is defined, otherwise use the contextTranslator, if neither of them is defined
  // use the fallback translator.
  const translator: Translator = selectedLocale ? userDefinedTranslator : (contextTranslator || Translator.fallback());

  const translatedLabel = $derived(
    translator.translate(labelId, variables),
  );

</script>


{#if translatedLabel}
  {translatedLabel}
{:else}
  {@render children?.()}
{/if}