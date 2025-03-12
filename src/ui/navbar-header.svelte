<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalSection from "./modal-section.svelte";
  import CloseButton from "./close-button.svelte";
  import BackButton from "./back-button.svelte";
  import IconArrow from "./icons/icon-arrow.svelte";
  import { LocalizationKeys } from "./localization/supportedLanguages";
  import Localized from "./localization/localized.svelte";

  export let children: Snippet;
  export let shouldShowDetailsButton = false;
  export let expanded = false;
  export let toggle;
  export let showCloseButton: boolean;
  export let onClose: (() => void) | undefined = undefined;
</script>

<ModalSection as="header">
  <div class="rcb-header-multiline-layout">
    {#if showCloseButton}
      <div class="rcb-back">
        <BackButton
          on:click={() => {
            onClose && onClose();
          }}
        />
      </div>
    {/if}
    <div class="rcb-header-layout">
      {@render children?.()}
      {#if shouldShowDetailsButton}
        <button
          type="button"
          class="rcb-header-details"
          on:click={toggle}
          on:keydown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
          aria-expanded={expanded}
          aria-controls="rcb-header-details-content"
        >
          <Localized key={LocalizationKeys.NavbarHeaderDetails} />
          <IconArrow className={expanded ? "expanded" : "collapsed"} />
        </button>
      {/if}
      {#if showCloseButton}
        <div class="rcb-close">
          <CloseButton
            on:click={() => {
              onClose && onClose();
            }}
          />
        </div>
      {/if}
    </div>
  </div>
</ModalSection>

<style>
  .rcb-header-multiline-layout {
    all: unset;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  button.rcb-header-details {
    all: unset;
    display: flex;
    align-items: center;
    cursor: pointer;
    font: var(--rc-text-largeCaption-mobile);
    gap: var(--rc-spacing-gapSmall-mobile);
    color: var(--rc-color-grey-text-light);
    padding: var(--rc-spacing-gapMedium-mobile);
  }

  .rcb-header-details {
    font: var(--rc-text-largeCaption-mobile);
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

  .rcb-back {
    display: none;
  }

  .rcb-close {
    display: inline-block;
  }

  @container layout-query-container (width >= 768px) {
    button.rcb-header-details {
      display: none;
    }

    .rcb-header-layout {
      width: auto;
    }

    .rcb-back {
      display: block;
    }

    .rcb-close {
      display: none;
    }

    .rcb-header-multiline-layout {
      gap: var(--rc-spacing-gapXLarge-desktop);
    }
  }
</style>
