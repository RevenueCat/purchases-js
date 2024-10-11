<script>
  import Spinner from "../spinner.svelte";

  let style = {};
</script>

<div class="rcb-modal-loader">
  <Spinner />
</div>

<style>
    .rcb-modal-loader {
        width: 100%;
        flex-grow: 1;
        min-height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
