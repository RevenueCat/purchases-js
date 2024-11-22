<script lang="ts">
  import { Translator } from "./translator";

  export interface LocalizedProps {
    labelId?: string;
    selectedLocale?: string;
    variables?: Record<string, string>;
    children?: any;
  }

  const { labelId, selectedLocale, variables, children }: LocalizedProps = $props();
  // TODO: Find another way to handle the default Locale
  const defaultLocale = "en";
  const translatedLabel = $derived(Translator.translate(selectedLocale || defaultLocale, labelId || "", variables));
</script>


{#if translatedLabel}
  {translatedLabel}
{:else}
  {@render children?.()}
{/if}