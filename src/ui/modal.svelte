<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let children: Snippet;
</script>

<div class="rcb-modal-container">
  <main class="rcb-modal-main" {style}>
    {@render children?.()}
  </main>
</div>

<style>
  .rcb-modal-container {
    width: 100%;
  }

  .rcb-modal-main {
    box-sizing: border-box;
    border-radius: var(--rc-shape-modal-border-radius);
    background-color: var(--rc-color-background);
    color: var(--rc-color-grey-text-dark);
    padding: 40px;
    flex-direction: column;
    display: flex;
  }

  @media screen and (max-width: 960px) {
    .rcb-modal-container {
      width: calc(100% - 32px);
      min-width: 300px;
      max-width: 640px;
      margin: auto;
    }

    .rcb-modal-main {
      min-width: 300px;
      max-width: 640px;
      padding: 32px;
    }
  }
</style>
