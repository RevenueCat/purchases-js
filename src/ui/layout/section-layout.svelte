<script lang="ts">
  import { fade } from "svelte/transition";

  export let show: boolean = true;
  export let layoutStyle: string | undefined = undefined;

  export let header: (() => any) | null = null;
  export let body: (() => any) | null = null;
</script>

<div class="layout-wrapper-outer" style={layoutStyle}>
  {#if show}
    <div class="layout-wrapper">
      <div
        class="layout-content"
        transition:fade={{ duration: 500, delay: 50 }}
      >
        {#if header}
          {@render header()}
        {/if}
        {#if body}
          {@render body()}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .layout-wrapper-outer {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }

  .layout-wrapper {
    width: 100%;
  }

  .layout-content {
    box-sizing: border-box;
    background-color: var(--rc-color-background);
    color: var(--rc-color-grey-text-dark);
    display: flex;
    flex-direction: column;
    padding: var(--rc-spacing-outerPadding-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .layout-wrapper {
      min-height: 100vh;
      flex-basis: 600px;
    }
  }

  @container layout-query-container (width >= 768px) and (width <= 1024px) {
    .layout-content {
      padding: var(--rc-spacing-outerPadding-tablet);
    }
  }

  @container layout-query-container (width > 1024px) {
    .layout-content {
      padding: var(--rc-spacing-outerPadding-desktop);
    }
  }

  @container layout-query-container (width < 768px) {
    .layout-wrapper {
      width: 100%;
      min-width: 300px;
      display: flex;
      flex-grow: 1;
    }

    .layout-content {
      flex-grow: 1;
      height: 100%;
    }
  }
</style>
