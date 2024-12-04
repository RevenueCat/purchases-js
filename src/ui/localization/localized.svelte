<script lang="ts">
  import {
    type EmptyString,
    LocalizationKeys,
    type TranslationVariables,
    Translator,
  } from "./translator";
  import { getContext } from "svelte";
  import { englishLocale, translatorContextKey } from "./constants";

  interface LocalizedProps {
    key?: LocalizationKeys | EmptyString | undefined;
    variables?: TranslationVariables;
    children?: any;
    selectedLocale?: string;
    defaultLocale?: string;
  }

  const {
    key = "",
    selectedLocale,
    defaultLocale = englishLocale,
    variables,
    children,
  }: LocalizedProps = $props();
  // Create a new translator if the user passes a selectedLocale
  const userDefinedTranslator: Translator = new Translator(
    {},
    selectedLocale || "",
    defaultLocale,
  );
  // Use the contextual translator if it exists
  const contextTranslator: Translator = getContext(translatorContextKey);
  // Use the userDefinedTranslator if the selectedLocale is defined, otherwise use the contextTranslator, if neither of them is defined
  // use the fallback translator.
  const translator: Translator = selectedLocale
    ? userDefinedTranslator
    : contextTranslator || Translator.fallback();

  const translatedLabel = $derived(
    key
      ? translator.translate(
          (key as LocalizationKeys) || ("" as EmptyString),
          variables,
        )
      : undefined,
  );
</script>

{#if translatedLabel}
  {translatedLabel}
{:else}
  {@render children?.()}
{/if}
