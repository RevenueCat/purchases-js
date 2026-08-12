<script lang="ts">
  import Typography from "../atoms/typography.svelte";

  interface Props {
    previousProductName: string;
  }

  const { previousProductName }: Props = $props();
</script>

<div class="rcb-refund-for-unused-time">
  <div class="rcb-refund-for-unused-time-title">
    <Typography size="body-small">Refund for unused time</Typography>
  </div>
  <div class="rcb-refund-for-unused-time-message">
    <Typography size="caption-default">
      Your payment method will be charged immediately and you'll receive a
      refund for the time remaining on your {previousProductName} subscription.
    </Typography>
  </div>
</div>

<style>
  .rcb-refund-for-unused-time {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    padding: var(--rc-spacing-gapLarge-mobile);
    border: 1px solid var(--rc-color-grey-ui-dark);
    border-radius: var(--rc-shape-input-border-radius);
    background-color: transparent;
  }

  .rcb-refund-for-unused-time-title {
    color: var(--rc-color-grey-text-dark);
  }

  .rcb-refund-for-unused-time-message {
    color: var(--rc-color-grey-text-light);
  }

  @container layout-query-container (width >= 768px) {
    .rcb-refund-for-unused-time {
      gap: var(--rc-spacing-gapSmall-desktop);
      padding: var(--rc-spacing-gapLarge-desktop);
    }
  }
</style>
