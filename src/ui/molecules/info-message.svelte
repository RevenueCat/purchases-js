<script lang="ts">
  import IconInfo from "../atoms/icons/icon-info.svelte";

  export type Props = {
    title: string;
    message: string;
  };

  const { title, message }: Props = $props();
</script>

<div class="rcb-info">
  <div class="rcb-info-icon-wrapper">
    <IconInfo />
  </div>
  <div class="rcb-info-content">
    <div class="rcb-info-title">{title}</div>
    <div class="rcb-info-message">{message}</div>
  </div>
</div>

<style>
  .rcb-info {
    display: flex;
    align-items: flex-start;
    background-color: var(--rc-color-grey-ui-light);
    border-radius: var(--rc-shape-input-border-radius);
    gap: var(--rc-spacing-gapLarge-mobile);
    padding: var(--rc-spacing-gapLarge-mobile);
  }

  .rcb-info-content {
    flex: 1;
  }

  .rcb-info-icon-wrapper {
    flex-shrink: 0;
    color: var(--rc-color-accent-primary);
  }

  .rcb-info-title {
    color: var(--rc-color-grey-text-dark);
    font: var(--rc-text-body1-mobile);
    margin-bottom: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-info-message {
    color: var(--rc-color-grey-text-light);
    font: var(--rc-text-body1-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-info {
      gap: var(--rc-spacing-gapLarge-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-info-title {
      font: var(--rc-text-body1-desktop);
      margin-bottom: var(--rc-spacing-gapSmall-desktop);
    }
  }
</style>
