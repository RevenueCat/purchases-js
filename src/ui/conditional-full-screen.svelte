<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalBackdrop from "./modal-backdrop.svelte";

  export let condition = false;
  export let children: Snippet;
</script>

{#if condition}
  <ModalBackdrop {children} />
{:else}
  {@render children?.()}
{/if}
