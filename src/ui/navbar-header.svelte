<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalSection from "./modal-section.svelte";
  import IconArrow from "./icons/icon-arrow.svelte";

  export let children: Snippet;
  export let expanded = false;
  export let toggle;
</script>

<ModalSection as="header">
  <div class="rcb-header-layout">
    {@render children?.()}
    <button
      type="button"
      class="rcb-header-details"
      on:click={toggle}
      on:keydown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
      aria-expanded={expanded}
      aria-controls="rcb-header-details-content"
    >
      Details
      <IconArrow className={expanded ? "expanded" : "collapsed"} />
    </button>
  </div>
</ModalSection>

<style>
  button.rcb-header-details {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: var(--rc-spacing-gapSmall-mobile);
    font: var(--rc-text-caption-mobile);
    color: var(--rc-color-grey-text-light);
    padding: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-header-details {
    font: var(--rc-text-caption-mobile);
    font-weight: normal;
    display: flex;
    align-items: center;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font: var(--rc-text-titleXLarge-mobile);
    margin: 0;
  }

  @media screen and (min-width: 768px) {
    button.rcb-header-details {
      display: none;
    }

    .rcb-header-layout {
      width: auto;
    }
  }
</style>
