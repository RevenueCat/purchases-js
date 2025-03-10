<script lang="ts">
  import { type Snippet } from "svelte";

  export let text: string | Snippet;
</script>

<div class="badge">
  {#if typeof text === "string"}
    {text}
  {:else}
    {@render text?.()}
  {/if}
</div>

<style>
  .badge {
    display: inline-block;
    white-space: nowrap;
    border-radius: var(--rc-shape-input-button-border-radius);
    background-color: var(--rc-color-accent);
    padding: var(--rc-spacing-gapSmall-mobile) 12px;
    border-radius: 44px;
    font: var(--rc-text-caption-mobile);
    font-size: 10px;
    font-weight: normal;
    color: var(--rc-color-grey-text-dark);
    text-transform: uppercase;
  }

  @container layout-query-container (width >= 768px) {
    .badge {
      padding: var(--rc-spacing-gapSmall-desktop) 16px;
      font: var(--rc-text-caption-desktop);
      font-size: 10px;
    }
  }
</style>
