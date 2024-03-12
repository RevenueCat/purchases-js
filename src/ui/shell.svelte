<script lang="ts">
  import ModalHeader from "./modal-header.svelte";
  import Modal from "./modal.svelte";
  import IconCart from "./assets/icon-cart.svelte";
  import BrandingInfoUI from "./branding-info-ui.svelte";

  import { BrandingInfoResponse } from "../networking/responses/branding-response";

  export let dark = false;
  export let showHeader = false;
  export let brandingInfo: BrandingInfoResponse | null = null;
</script>

<Modal {dark}>
  {#if showHeader}
    <ModalHeader>
      <BrandingInfoUI {brandingInfo} />
      <IconCart />
    </ModalHeader>
  {/if}
  <slot />
</Modal>
