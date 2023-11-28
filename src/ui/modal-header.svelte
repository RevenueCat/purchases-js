<script lang="ts">
  import ModalSection from "./modal-section.svelte";

  export let title = "";
</script>

<ModalSection as="header">
  <h1 class="app-title">{title}</h1>
</ModalSection>

<style>
  .app-title {
    font-weight: bold;
    margin: 0.5rem 0;
    font-size: 1.25rem;
  }
</style>
