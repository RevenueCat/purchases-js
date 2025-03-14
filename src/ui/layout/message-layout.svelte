<script lang="ts">
  import Button from "../components/button.svelte";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import RowLayout from "./row-layout.svelte";
  import { type ContinueHandlerParams } from "../ui-types";

  export let onContinue: (params?: ContinueHandlerParams) => void;
  export let title: string | null = null;
  export let type: string;
  export let closeButtonTitle: string = "Go back to app";
  export let icon: (() => any) | null = null;
  export let message;

  function handleContinue() {
    onContinue();
  }
</script>

<div class="message-layout">
  <div class="message-layout-content">
    <RowLayout gap="large">
      <ModalSection>
        <div
          class="rcb-modal-message"
          data-type={type}
          data-has-title={!!title}
        >
          <RowLayout gap="large" align="center">
            <RowLayout gap="large" align="center">
              {#if icon}
                {@render icon()}
              {/if}
              {#if title}
                <span class="rcb-title">{title}</span>
              {/if}
              {#if message}
                <span class="rcb-subtitle">
                  {@render message()}
                </span>
              {/if}
            </RowLayout>
          </RowLayout>
        </div>
      </ModalSection>
    </RowLayout>
  </div>
  <div class="message-layout-footer">
    <ModalFooter>
      <Button on:click={handleContinue} type="submit">{closeButtonTitle}</Button
      >
    </ModalFooter>
  </div>
</div>

<style>
  .message-layout {
    display: flex;
    flex-direction: column;
  }

  .message-layout-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .rcb-modal-message {
    width: 100%;
    min-height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-title {
    font: var(--rc-text-titleLarge-mobile);
  }

  .rcb-subtitle {
    font: var(--rc-text-body1-mobile);
  }

  @container layout-query-container (width < 768px) {
    .message-layout {
      flex-grow: 1;
    }
  }

  @container layout-query-container (width >= 768px) {
    .message-layout {
      min-height: 440px;
    }
    .message-layout-content {
      justify-content: flex-start;
      flex-grow: 1;
    }

    .message-layout-footer {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
    .rcb-modal-message[data-has-title="false"] {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }

    .rcb-title {
      font: var(--rc-text-titleLarge-desktop);
    }

    .rcb-subtitle {
      font: var(--rc-text-body1-desktop);
    }
  }
</style>
