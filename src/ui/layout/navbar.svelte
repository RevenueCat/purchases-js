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
  .rcb-ui-navbar {
    width: 100%;
    max-width: none;
    flex-shrink: 0;
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-navbar {
      width: 50vw;
      max-width: 50vw;
    }
  }
</style>
