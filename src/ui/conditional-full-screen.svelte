<script>
  import ModalHeader from "./modal-header.svelte";
  import ModalBackdrop from "./modal-backdrop.svelte";
  import Modal from "./modal.svelte";

  export let condition = false;
</script>

{#if condition}
  <ModalBackdrop>
    <slot />
  </ModalBackdrop>
{:else}
  <slot />
{/if}
