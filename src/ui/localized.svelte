<script lang="ts">
  export interface LocalizedProps {
    labelId?: string;
    selectedLocale?: string;
    children?: any;
  }

  const { labelId, selectedLocale, children }: LocalizedProps = $props();
  const translatedLabel = $derived(labelId);
</script>


{#if labelId}
  {translatedLabel}
{:else}
  {@render children?.()}
{/if}