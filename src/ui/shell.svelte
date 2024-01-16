<script lang="ts">
  import ModalHeader from "./modal-header.svelte";
  import Modal from "./modal.svelte";

  export let title = "";
  export let dark = false;
</script>

<Modal {dark}>
  {#if title}
    <ModalHeader {title} />
  {/if}
  <slot />
</Modal>
