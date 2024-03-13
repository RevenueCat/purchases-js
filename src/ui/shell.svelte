<script lang="ts">
  import Modal from "./modal.svelte";
  export let dark = false;
</script>

<Modal {dark}>
  <slot name="header" />
  <slot />
</Modal>
