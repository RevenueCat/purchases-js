<script>
  import ModalHeader from "./modal-header.svelte";
  import ModalBackdrop from "./modal-backdrop.svelte";
  import Modal from "./modal.svelte";

  export let condition = false;
  export let title = "RevenueCat Billing";
</script>

{#if condition}
  <ModalBackdrop>
    <Modal>
      <ModalHeader {title} />
      <slot />
    </Modal>
  </ModalBackdrop>
{:else}
  <slot />
{/if}
