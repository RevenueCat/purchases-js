<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalSection from "./modal-section.svelte";
  import IconArrow from "./icons/icon-arrow.svelte";

  export let children: Snippet;
  export let expanded = false;
  export let toggle;
</script>

<ModalSection as="header">
  {#if expanded !== undefined}
    {console.log("Value of expanded:", expanded)}
  {/if}
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
    gap: 4px;
    font-size: 12px;
    line-height: 16px;
    font-weight: 500;
    padding: 8px;
  }

  .rcb-header-details {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .rcb-header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 24px;
    margin: 0;
    font-weight: 500;
  }
</style>
