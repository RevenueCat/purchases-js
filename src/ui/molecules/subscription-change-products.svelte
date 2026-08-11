<script lang="ts">
  import Typography from "../atoms/typography.svelte";

  interface Props {
    fromTitle: string;
    fromPrice: string;
    toTitle: string;
    toPrice: string;
  }

  let { fromTitle, fromPrice, toTitle, toPrice }: Props = $props();
</script>

<div class="rcb-subscription-change-products">
  <div
    class="rcb-subscription-change-product rcb-subscription-change-product--current"
  >
    <div class="rcb-subscription-change-product-details">
      <Typography size="body-base">{fromTitle}</Typography>
      <span class="rcb-subscription-change-product-price">
        <Typography size="caption-default">{fromPrice}</Typography>
      </span>
    </div>
    <span
      class="rcb-subscription-change-badge rcb-subscription-change-badge--current"
    >
      <Typography size="caption-default">Current</Typography>
    </span>
  </div>

  <div
    class="rcb-subscription-change-product rcb-subscription-change-product--new"
  >
    <div class="rcb-subscription-change-product-details">
      <Typography size="body-base">{toTitle}</Typography>
      <span class="rcb-subscription-change-product-price">
        <Typography size="caption-default">{toPrice}</Typography>
      </span>
    </div>
    <span
      class="rcb-subscription-change-badge rcb-subscription-change-badge--new"
    >
      <Typography size="caption-default">New</Typography>
    </span>
  </div>
</div>

<style>
  .rcb-subscription-change-products {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapMedium-mobile);
    width: 100%;
  }

  .rcb-subscription-change-product {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--rc-spacing-gapLarge-mobile);
    padding: 16px;
    border-radius: var(--rc-shape-input-border-radius);
    overflow: clip;
  }

  .rcb-subscription-change-product--current {
    /* Same surface treatment as the "Show details" control */
    background-color: var(--rc-color-grey-ui-light);
  }

  .rcb-subscription-change-product--new {
    background-color: var(--rc-color-white);
    /* Always dark text: theme greys flip to light on dark product-info panels */
    --rc-color-grey-text-dark: rgb(0, 0, 0);
    --rc-color-grey-text-light: rgba(0, 0, 0, 0.7);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  }

  .rcb-subscription-change-product-details {
    display: flex;
    flex-direction: column;
    gap: var(--rc-spacing-gapSmall-mobile);
    color: var(--rc-color-grey-text-dark);
    min-width: 0;
  }

  .rcb-subscription-change-product-price {
    color: var(--rc-color-grey-text-light);
  }

  .rcb-subscription-change-badge {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    padding: 4px 8px;
    border-radius: var(--rc-shape-input-button-border-radius);
    font-weight: 600;
  }

  .rcb-subscription-change-badge--current {
    background-color: transparent;
    color: var(--rc-color-grey-text-dark);
    box-shadow: inset 0 0 0 1px var(--rc-color-grey-ui-dark);
  }

  .rcb-subscription-change-badge--new {
    background-color: var(--rc-color-primary);
    color: var(--rc-color-primary-text);
    padding: 2px 8px;
  }

  @container layout-query-container (width >= 768px) {
    .rcb-subscription-change-products {
      gap: var(--rc-spacing-gapSmall-desktop);
    }

    .rcb-subscription-change-product {
      gap: var(--rc-spacing-gapLarge-desktop);
    }

    .rcb-subscription-change-product-details {
      gap: var(--rc-spacing-gapSmall-desktop);
    }
  }
</style>
