<script lang="ts">
  import ModalHeader from "./modal-header.svelte";
  import Modal from "./modal.svelte";
  import { BrandingInfoResponse } from "../entities/types";

  export let title = "";
  export let dark = false;
  export let showHeader = false;
  export let brandingInfo: BrandingInfoResponse | null;
</script>

<Modal {dark}>
  {#if showHeader}
    <ModalHeader {brandingInfo} />
  {/if}
  <slot />
</Modal>
