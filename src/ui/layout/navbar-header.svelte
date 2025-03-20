<script lang="ts">
  import { type Snippet } from "svelte";
  import ModalSection from "./modal-section.svelte";
  import CloseButton from "../molecules/close-button.svelte";
  import BackButton from "../molecules/back-button.svelte";

  export let children: Snippet;
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
