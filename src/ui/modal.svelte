<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let as: string = "div";
  export let children: Snippet;
</script>

<div class="rcb-modal-container" {style}>
  <svelte:element this={as} class="rcb-modal-main">
    {@render children?.()}
  </svelte:element>
</div>

<style>
  .rcb-modal-container {
    width: 100%;
    height: 100%;
  }

  .rcb-modal-main {
    box-sizing: border-box;
    background-color: var(--rc-color-background);
    color: var(--rc-color-grey-text-dark);
    padding: var(--rc-spacing-outerPadding-desktop);
    flex-direction: column;
    display: flex;
    height: 100%;
  }

  @media screen and (min-width: 768px) {
    .rcb-modal-container {
      height: 100vh;
    }
  }

  @media screen and (max-width: 768px) {
    .rcb-modal-container {
      width: 100%;
      min-width: 300px;
      margin: auto;
    }

    .rcb-modal-main {
      padding: var(--rc-spacing-outerPadding-mobile);
    }
  }
</style>
