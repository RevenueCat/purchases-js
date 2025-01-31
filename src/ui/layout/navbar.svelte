<script lang="ts">
  import { type BrandingAppearance } from "../../networking/responses/branding-response";
  import Modal from "../modal.svelte";
  import { Theme } from "../theme/theme";
  import NavBarHeader from "../navbar-header.svelte";
  import { onMount } from "svelte";
  export let brandingAppearance: BrandingAppearance | undefined = undefined;
  let style = new Theme(brandingAppearance).productInfoStyleVars;

  export let headerContent;
  export let bodyContent: (expanded: boolean) => any;

  let expanded = false;

  let showModal = false;

  onMount(() => {
    setTimeout(() => {
      showModal = true;
    }, 10);
  });

  const toggleExpanded = () => {
    expanded = !expanded;
  };
</script>

<div class="rcb-ui-navbar" {style}>
  <div class="inner-container">
    {#if showModal}
      <Modal delayFade={50}>
        <NavBarHeader {expanded} toggle={toggleExpanded}>
          {@render headerContent?.()}
        </NavBarHeader>
        {@render bodyContent?.(expanded)}
      </Modal>
    {/if}
  </div>
</div>

<style>
  .rcb-ui-navbar {
    width: 100%;
    max-width: none;
    flex-shrink: 0;
    background-color: var(--rc-color-background);
  }

  .inner-container {
    min-height: 100%;
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-navbar {
      width: 50vw;
      display: flex;
      justify-content: flex-end;
    }
  }

  .inner-container {
    flex-basis: 600px;
  }
</style>
