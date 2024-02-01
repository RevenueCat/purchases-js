<script lang="ts">
  import ModalSection from "./modal-section.svelte";
  import AppIcon from "./app-icon.svelte";
  import IconCart from "./assets/icon-cart.svelte";
  import { BrandingInfoResponse } from "../entities/types";

  export let title = "";
  export let brandingInfo: BrandingInfoResponse | null = null;
</script>

<ModalSection as="header">
  <div class="rcb-header-layout">
    <div class="rcb-header-layout__business-info">
      {#if brandingInfo !== null}
        <AppIcon src={brandingInfo.appIconWebp} />
        <span class="app-title">{brandingInfo.sellerCompanyName}</span>
      {:else}
        <AppIcon />
      {/if}
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
