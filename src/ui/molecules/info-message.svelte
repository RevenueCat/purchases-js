<script lang="ts">
  import IconInfo from "../atoms/icons/icon-info.svelte";
  import Typography from "../atoms/typography.svelte";

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
    <div class="rcb-info-title">
      <Typography size="body-base">{title}</Typography>
    </div>
    <div class="rcb-info-message">
      <Typography size="body-base">{message}</Typography>
    </div>
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
    margin-bottom: var(--rc-spacing-gapSmall-mobile);
  }

  .rcb-info-message {
    color: var(--rc-color-grey-text-light);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-info {
      gap: var(--rc-spacing-gapLarge-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-info-title {
      margin-bottom: var(--rc-spacing-gapSmall-desktop);
    }
  }
</style>
