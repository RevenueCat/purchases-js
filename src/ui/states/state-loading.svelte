<script>
  import Spinner from "../spinner.svelte";

  let style = "";
</script>

<div class="rcb-modal-loader">
  <Spinner />
</div>

<style>
  .rcb-modal-loader {
    width: 100%;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @container layout-query-container (width > 768px) {
    .rcb-modal-loader {
      align-items: flex-start;
      margin-top: calc(var(--rc-spacing-gapXXLarge-desktop) * 6);
    }
  }
</style>
