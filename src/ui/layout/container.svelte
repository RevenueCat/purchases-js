<script>
  export let style = "";
</script>

<div class="rcb-ui-container" {style}>
  <slot />
</div>

<style>
  .rcb-ui-container {
    color-scheme: none;
    font-size: 16px;
    line-height: 1.5em;
    font-weight: 400;
    font-family: -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu,
      Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
