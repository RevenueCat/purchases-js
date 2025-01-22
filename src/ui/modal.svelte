<script lang="ts">
  import { type Snippet } from "svelte";

  export let style = "";
  export let as: string = "div";
  export let children: Snippet;
</script>

<div class="rcb-modal-container">
  <svelte:element this={as} class="rcb-modal-main" {style}>
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
    padding: 40px;
    flex-direction: column;
    display: flex;
    height: 100%;
  }

  @media screen and (max-width: 960px) {
    .rcb-modal-container {
      width: 100%;
      min-width: 300px;
      max-width: 640px;
      margin: auto;
    }

    .rcb-modal-main {
      min-width: 300px;
      max-width: 640px;
      padding: 21px;
    }
  }
</style>
