<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";
  import { onMount } from "svelte";
  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).formStyleVars;
  export let body;
  export let header: (() => any) | null = null;

  let showModal = false;

  onMount(() => {
    setTimeout(() => {
      showModal = true;
    }, 10);
  });
</script>

<div class="rcb-ui-main" {style}>
  <div class="inner-container">
    {#if showModal}
      <Modal delayFade={50}>
        {#if header}
          {@render header()}
        {/if}
        {@render body()}
      </Modal>
    {/if}
  </div>
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }

  @media screen and (max-width: 767px) {
    .inner-container {
      flex-grow: 1;
      display: flex;
    }
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-main {
      width: auto;
      flex-grow: 1;
      justify-content: flex-start;
    }

    .inner-container {
      flex-basis: 600px;
    }
  }
</style>
