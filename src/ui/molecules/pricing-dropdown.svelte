<script lang="ts">
  import { type Snippet } from "svelte";
  import Icon from "../atoms/icon.svelte";
  import { LocalizationKeys } from "../localization/supportedLanguages";
  import { translatorContextKey } from "../localization/constants";
  import { getContext } from "svelte";
  import { type Writable } from "svelte/store";
  import { Translator } from "../localization/translator";

  export let isExpanded: boolean = true;
  export let children: Snippet;

  const translator: Writable<Translator> = getContext(translatorContextKey);

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<div class="rcb-pricing-dropdown">
  <div
    class="rcb-pricing-dropdown-header"
    on:click={toggleExpanded}
    on:keydown={(e) =>
      e.key === "Enter" || e.key === " " ? toggleExpanded() : null}
    tabindex="0"
    role="button"
    aria-expanded={isExpanded}
  >
    {#if isExpanded}
      {$translator.translate(LocalizationKeys.PricingDropdownHideDetails)}
    {:else}
      {$translator.translate(LocalizationKeys.PricingDropdownShowDetails)}
    {/if}
    <span class="rcb-pricing-dropdown-toggle">
      {#if isExpanded}
        <Icon name="chevron-up" />
      {:else}
        <Icon name="chevron-down" />
      {/if}
    </span>
  </div>

  <div class="rcb-pricing-dropdown-content" class:collapsed={!isExpanded}>
    {@render children?.()}
  </div>
</div>

<style>
  .rcb-pricing-dropdown {
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-pricing-dropdown-header {
    padding: 2px 8px 2px 12px;
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--rc-shape-input-button-border-radius);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    background-color: var(--rc-color-grey-ui-light);
    width: fit-content;
    user-select: none;
  }

  .rcb-pricing-dropdown-toggle {
    display: flex;
    align-items: center;
    margin-left: 4px;
    font-size: 12px;
  }

  .rcb-pricing-dropdown-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @container layout-query-container (width < 768px) {
    .rcb-pricing-dropdown-content {
      max-height: 1000px; /* Set a large max-height for animation */
      transition: max-height 0.2s ease-in-out;
    }

    .rcb-pricing-dropdown-content.collapsed {
      max-height: 0;
    }
  }

  @container layout-query-container (width >= 768px) {
    .rcb-pricing-dropdown-header {
      display: none;
    }
  }
</style>
