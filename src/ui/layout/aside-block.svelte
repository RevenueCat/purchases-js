<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).productInfoStyleVars;
</script>

<div class="rcb-ui-aside" style={style}>
  <Modal>
    <slot name="header" />
    <slot />
  </Modal>
</div>

<style>
    .rcb-ui-aside {
        margin-right: 16px;
        flex: 320px 1 0;
        max-width: 480px;
    }

    @media screen and (max-width: 960px) {
        .rcb-ui-aside {
            margin-right: 0;
            margin-bottom: 16px;
            min-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: none;
            max-width: none;
        }
    }
</style>