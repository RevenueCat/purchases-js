<script lang="ts">
  export let as = "section";
</script>

<svelte:element this={as} class={`rcb-modal-section`}>
  <slot />
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
