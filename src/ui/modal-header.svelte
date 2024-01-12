<script lang="ts">
  import ModalSection from "./modal-section.svelte";
  import AppIcon from "./app-icon.svelte";
  import IconCart from "./assets/icon-cart.svelte";

  export let title = "";
</script>

<ModalSection as="header">
  <div class="rcb-header-layout">
    <div class="rcb-header-layout__business-info">
      <AppIcon />
      <span class="app-title">{title}</span>
    </div>
    <IconCart />
  </div>
</ModalSection>

<style>
  .app-title {
    font-weight: 500;
    margin: 0.5rem 0;
    font-size: 1rem;
  }

  .rcb-header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .rcb-header-layout__business-info {
    display: flex;
    align-items: center;
  }
</style>
