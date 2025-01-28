<script lang="ts">
  import Button from "../button.svelte";
  import ModalFooter from "../modal-footer.svelte";
  import ModalSection from "../modal-section.svelte";
  import RowLayout from "../layout/row-layout.svelte";

  export let onContinue: () => void;
  export let title: string | null = null;
  export let type: string;
  export let closeButtonTitle: string = "Go back to app";
  export let icon: (() => any) | null = null;
  export let message;
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
                <span class="title">{title}</span>
              {/if}
              {#if message}
                <span class="subtitle">
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
      <Button on:click={onContinue} type="submit">{closeButtonTitle}</Button>
    </ModalFooter>
  </div>
</div>

<style>
  .message-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .message-layout-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .message-layout-content {
      justify-content: flex-start;
      flex-grow: 0;
    }

    .message-layout-footer {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
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

  .title {
    font: var(--rc-text-title3-mobile);
  }

  .subtitle {
    font: var(--rc-text-body1-mobile);
  }

  @media (min-width: 768px) {
    .rcb-modal-message[data-has-title="false"] {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }

    .title {
      font: var(--rc-text-title3-desktop);
    }

    .subtitle {
      font: var(--rc-text-body1-desktop);
    }
  }
</style>
