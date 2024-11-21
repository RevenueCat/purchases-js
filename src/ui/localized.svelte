<script lang="ts">


  interface Props {
    labelId: string;
    children?: any;
  }

  const { labelId, children }: Props = $props();
  const translatedLabel = $derived(labelId);
</script>


{#if labelId}
  {translatedLabel}
{:else}
  {@render children?.()}
{/if}