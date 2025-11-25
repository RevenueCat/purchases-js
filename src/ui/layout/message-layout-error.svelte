<script lang="ts">
  import ColLayout from "./col-layout.svelte";
  import RowLayout from "./row-layout.svelte";
  import Typography from "../atoms/typography.svelte";
  import { onMount } from "svelte";
  const { title = null, icon = null, message } = $props();

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
</script>

<div class="rcb-modal-message" data-type="error" data-has-title={!!title}>
  <ColLayout gap="medium" justify="start">
    <RowLayout>
      {#if icon}
        <div
          class="rcb-modal-message-icon {isTitleWrapped ? 'large' : 'small'}"
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
</div>

<style>
  .rcb-modal-message-icon {
    flex-shrink: 0;
    align-self: center;
    margin-right: 16px;
  }

  .rcb-modal-message {
    width: 100%;
    min-height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: left;
    margin-top: 4px;
  }

  .rcb-modal-message[data-has-title="false"] {
    margin-top: var(--rc-spacing-gapXXLarge-mobile);
  }

  .rcb-modal-message-icon.small {
    height: var(--rc-text-headingLg-mobile-font-size);
    width: var(--rc-text-headingLg-mobile-font-size);
  }

  .rcb-modal-message-icon.large {
    height: calc(2 * var(--rc-text-headingMd-mobile-font-size));
    width: calc(2 * var(--rc-text-headingMd-mobile-font-size));
  }

  @container layout-query-container (width >= 768px) {
    .rcb-modal-message-icon.small {
      height: var(--rc-text-headingLg-desktop-font-size);
      width: var(--rc-text-headingLg-desktop-font-size);
    }

    .rcb-modal-message-icon.large {
      height: calc(2 * var(--rc-text-headingMd-desktop-font-size));
      width: calc(2 * var(--rc-text-headingMd-desktop-font-size));
    }
    .rcb-modal-message[data-has-title="false"] {
      margin-top: var(--rc-spacing-gapXXLarge-desktop);
    }
  }
</style>
