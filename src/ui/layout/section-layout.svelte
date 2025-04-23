<script lang="ts">
  import { type Snippet } from "svelte";
  import { fade } from "svelte/transition";

  type Props = {
    location: "navbar" | "main-block";
    children?: Snippet<[]>;
  };

  const { location, children }: Props = $props();

  const locationClass = `rcb-${location}`;
</script>

<div class="layout-wrapper-outer {locationClass}">
  <div class="layout-wrapper">
    <div
      class="layout-content {locationClass}"
      transition:fade={{ duration: 500, delay: 50 }}
    >
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  .layout-wrapper-outer {
    flex: 1;
    display: flex;
    background-color: var(--rc-color-background);
  }

  .layout-wrapper-outer.rcb-navbar {
    justify-content: flex-end;
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
  }

  .layout-content.rcb-main-block {
    padding: var(--rc-spacing-outerPadding-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .layout-wrapper {
      min-height: 100vh;
      flex-basis: 600px;
    }

    .layout-content.rcb-main-block {
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
