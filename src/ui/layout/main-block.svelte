<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).formStyleVars;

  export let body;
  export let header: (() => any) | null = null;
</script>

<div class="rcb-ui-main" {style}>
  <Modal>
    {#if header}
      {@render header()}
    {/if}
    {@render body()}
  </Modal>
</div>

<style>
  .rcb-ui-main {
    flex: 1;
    width: 100%;
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-main {
      width: auto;
      flex-grow: 1;
    }
  }
</style>
