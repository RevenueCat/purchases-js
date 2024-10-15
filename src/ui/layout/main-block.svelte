<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).formStyleVars;
</script>

<div class="rcb-ui-main" style={style}>
  <Modal style="min-height: 360px;">
    <slot name="header" />
    <slot />
  </Modal>
</div>

<style>
    .rcb-ui-main {
        flex: 480px 1 0;
        max-width: 640px;
    }

    @media screen and (max-width: 960px) {

        .rcb-ui-main {
            flex: none;
            max-width: none;
            min-width: 100%;
        }
    }
</style>