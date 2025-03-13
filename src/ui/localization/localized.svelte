<script lang="ts">
  import {
    type EmptyString,
    type TranslationVariables,
    Translator,
  } from "./translator";
  import { getContext } from "svelte";
  import { translatorContextKey } from "./constants";

  import { LocalizationKeys } from "./supportedLanguages";
  import { type Writable } from "svelte/store";

  interface LocalizedProps {
    key?: LocalizationKeys | EmptyString | undefined;
    variables?: TranslationVariables;
    children?: any;
  }

  const { key = "", variables, children }: LocalizedProps = $props();

  const translator = getContext<Writable<Translator>>(translatorContextKey);

  const translatedLabel = $derived(
    key
      ? $translator.translate(
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
