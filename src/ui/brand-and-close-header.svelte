<script lang="ts">
  import ModalSection from "./modal-section.svelte";
  import CloseButton from "./close-button.svelte";
  import BrandingInfoUI from "./branding-info-ui.svelte";
  import { BrandingInfoResponse } from "../networking/responses/branding-response";

  export let brandingInfo: BrandingInfoResponse | null = null;
  export let onClose: () => void;
</script>

<ModalSection as="header">
  <div class="rcb-post-purchase-header-layout">
    <BrandingInfoUI brandingInfo={brandingInfo} />
    <CloseButton on:click={onClose} />
  </div>
</ModalSection>

<style>
  .rcb-post-purchase-header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
</style>
