<script>
  import { Typography } from "../atoms/typography.svelte";
  export let text;
</script>

<div class="text-separator">
  <hr class="line" />
  <span class="text"
    ><Typography size="caption-default">{text}</Typography></span
  >
  <hr class="line" />
</div>

<style>
  .text-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  @container layout-query-container (width >= 768px) {
    .text-separator {
      gap: var(--rc-spacing-gapSmall-desktop);
    }
  }

  .line {
    flex: 1;
    height: 1px;
    background-color: var(--rc-color-grey-ui-dark);
    border: none;
  }

  .text {
    color: var(--rc-color-grey-text-light);
    text-transform: uppercase;
    white-space: nowrap;
  }
</style>
