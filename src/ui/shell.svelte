<script lang="ts">
  import ModalHeader from "./modal-header.svelte";
  import Modal from "./modal.svelte";
  import { BrandingInfoResponse } from "../networking/responses/branding-response";

  export let title = "";
  export let dark = false;
  export let showHeader = false;
  export let brandingInfo: BrandingInfoResponse | null = null;
</script>

<Modal {dark}>
  {#if showHeader}
    <ModalHeader {brandingInfo} />
  {/if}
  <slot />
</Modal>
