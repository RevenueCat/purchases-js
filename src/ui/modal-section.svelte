<script lang="ts">
  export let as = "section";
</script>

<svelte:element this={as} class={`rcb-modal-section`}>
  <slot />
</svelte:element>

<style>
  .rcb-modal-section {
    padding: 0.5rem 0rem;
    display: flex;
  }

  .rcb-modal-section:last-of-type {
    padding: 0;
  }
</style>
