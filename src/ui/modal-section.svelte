<script lang="ts">
  export let as = "section";
</script>

<svelte:element this={as} class="rcb-modal-section">
  <slot />
</svelte:element>

<style>
  .rcb-modal-section {
    border-bottom: 1px solid #ccc;
    padding: 0.5rem 1rem;
    display: flex;
  }
</style>
