<script lang="ts">
  export let style = "";
</script>

<div class="rcb-ui-sandbox-banner" {style}>Sandbox</div>

<style>
  .rcb-ui-sandbox-banner {
    background-color: var(--rc-color-warning);
    color: rgba(0, 0, 0, 1);
    font: var(--rc-text-caption-mobile);
    font-weight: bold;
    text-transform: uppercase;
    padding: var(--rc-spacing-gapSmall-mobile);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media screen and (min-width: 768px) {
    .rcb-ui-sandbox-banner {
      padding: var(--rc-spacing-gapMedium-desktop);
      font: var(--rc-text-caption-desktop);
      font-weight: bold;
    }
  }
</style>
