<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalSection from "./modal-section.svelte";

  export let children: Snippet;
</script>

<ModalSection as="header">
  <div class="rcb-header-layout">
    {@render children?.()}
  </div>
</ModalSection>

<style>
  .rcb-header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 24px;
    margin: 0;
    font-weight: 500;
  }
</style>
