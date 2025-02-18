<script>
  export let text;
</script>

<div class="text-separator">
  <hr class="line" />
  <span class="text">{text}</span>
  <hr class="line" />
</div>

<style>
  .text-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-spacing-gapSmall-mobile);
  }

  @container layout-query-container (width > 768px) {
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
    font: var(--rc-text-caption-mobile);
    color: var(--rc-color-grey-text-light);
    text-transform: uppercase;
    white-space: nowrap;
  }

  @container layout-query-container (width > 768px) {
    .text {
      font: var(--rc-text-caption-desktop);
    }
  }
</style>
