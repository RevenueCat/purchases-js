<script lang="ts">
  import { Button } from "@revenuecat/purchases-ui-js";
  import ModalFooter from "./modal-footer.svelte";
  import ModalSection from "./modal-section.svelte";
  import ColLayout from "./col-layout.svelte";
  import RowLayout from "./row-layout.svelte";
  import Typography from "../atoms/typography.svelte";
  import { onMount } from "svelte";
  const {
    onDismiss,
    title = null,
    type,
    closeButtonTitle = "Go back to app",
    icon = null,
    message,
  } = $props();

  const MAX_SINGLE_LINE_PIXEL_HEIGHT = 32;

  let titleElement: HTMLElement | null = $state(null);
  let isTitleWrapped = $state(false);
  let resizeObserver: ResizeObserver;

  onMount(() => {
    if (titleElement) {
      resizeObserver = new ResizeObserver(() => {
        isTitleWrapped =
          (titleElement?.offsetHeight ?? 0) > MAX_SINGLE_LINE_PIXEL_HEIGHT;
      });
      resizeObserver.observe(titleElement);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  });

  function handleClick() {
    onDismiss();
  }
</script>

<div class="message-layout">
  <div class="message-layout-content">
    <ColLayout gap="large">
      <ModalSection>
        <div
          class="rcb-modal-message"
          data-type={type}
          data-has-title={!!title}
        >
          <ColLayout gap="large" align="center">
            <ColLayout gap="medium" align="start">
              <RowLayout gap="medium" align="center">
                {#if icon}
                  <div
                    class="rcb-modal-message-icon {isTitleWrapped
                      ? 'large'
                      : 'small'}"
                  >
                    {@render icon()}
                  </div>
                {/if}
                {#if title}
                  <span style="display: block;" bind:this={titleElement}>
                    <Typography size="heading-md">{title}</Typography>
                  </span>
                {/if}
              </RowLayout>
              {#if message}
                <Typography size="body-small">{@render message?.()}</Typography>
              {/if}
            </ColLayout>
          </ColLayout>
        </div>
      </ModalSection>
    </ColLayout>
  </div>
  <div class="message-layout-footer">
    <ModalFooter>
      <Button onclick={handleClick} type="submit"
        ><Typography size="body-small">{closeButtonTitle}</Typography></Button
      >
    </ModalFooter>
  </div>
</div>

<style>
  .message-layout {
    display: flex;
    flex-direction: column;
    padding-top: 4px;
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
    text-align: left;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-modal-message-icon {
    flex-shrink: 0;
    align-self: center;
    margin-right: 16px;
  }

  .rcb-modal-message-icon.small {
    height: var(--rc-text-headingMd-mobile-font-size);
    width: var(--rc-text-headingMd-mobile-font-size);
  }

  .rcb-modal-message-icon.large {
    height: calc(2 * var(--rc-text-headingMd-mobile-font-size));
    width: calc(2 * var(--rc-text-headingMd-mobile-font-size));
  }

  @container layout-query-container (width < 768px) {
    .message-layout {
      flex-grow: 1;
    }
  }

  @container layout-query-container (width >= 768px) {
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
    .rcb-modal-message-icon.small {
      height: var(--rc-text-headingMd-desktop-font-size);
      width: var(--rc-text-headingMd-desktop-font-size);
    }

    .rcb-modal-message-icon.large {
      height: calc(2 * var(--rc-text-headingMd-desktop-font-size));
      width: calc(2 * var(--rc-text-headingMd-desktop-font-size));
    }
  }
</style>
