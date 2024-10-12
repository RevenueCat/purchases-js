<script lang="ts">
  import { toProductInfoStyleVar } from "../theme/utils.ts";
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";

  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = toProductInfoStyleVar(brandingAppearance);
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