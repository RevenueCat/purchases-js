<script lang="ts">
  import { type Snippet } from "svelte";
  import { fade } from "svelte/transition";
  export let style = "";
  export let as: string = "div";
  export let children: Snippet;
  export let delayFade = 130;
</script>

<div class="rcb-modal-container" {style}>
  <svelte:element
    this={as}
    class="rcb-modal-main"
    transition:fade={{ duration: 500, delay: delayFade }}
  >
    {@render children?.()}
  </svelte:element>
</div>

<style>
  .rcb-modal-container {
    width: 100%;
  }

  .rcb-modal-main {
    box-sizing: border-box;
    background-color: var(--rc-color-background);
    color: var(--rc-color-grey-text-dark);
    padding: var(--rc-spacing-outerPadding-desktop);
    flex-direction: column;
    display: flex;
  }

  @media screen and (min-width: 768px) {
    .rcb-modal-container {
      min-height: 100vh;
    }
  }

  @media screen and (max-width: 767px) {
    .rcb-modal-container {
      width: 100%;
      min-width: 300px;
    }

    .rcb-modal-main {
      padding: var(--rc-spacing-outerPadding-mobile);
      height: 100%;
    }
  }
</style>
