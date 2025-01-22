<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";
  import NavBarHeader from "../navbar-header.svelte";
  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).productInfoStyleVars;

  export let headerContent;
  export let bodyContent: (expanded: boolean) => any;

  let expanded = false;

  const toggleExpanded = () => {
    expanded = !expanded;
  };
</script>

<div class="rcb-ui-navbar" {style}>
  <Modal as="div">
    <NavBarHeader {expanded} toggle={toggleExpanded}>
      {@render headerContent?.()}
    </NavBarHeader>
    {@render bodyContent?.(expanded)}
  </Modal>
</div>

<style>
  @media screen and (max-width: 960px) {
    .rcb-ui-navbar {
      margin-right: 0;
      margin-bottom: 0;
      min-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: none;
      max-width: none;
    }
  }
</style>
