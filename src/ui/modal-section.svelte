<script lang="ts">
  import { type Snippet } from "svelte";

  export let as = "section";
  export let children: Snippet;
</script>

<svelte:element this={as} class={`rcb-modal-section`}>
  {@render children?.()}
</svelte:element>

<style>
  .rcb-modal-section {
    padding: 8px 0px;
    display: flex;
  }

  section.rcb-modal-section {
    flex-grow: 1;
  }

  .rcb-modal-section:last-of-type {
    padding: 0;
  }
</style>
